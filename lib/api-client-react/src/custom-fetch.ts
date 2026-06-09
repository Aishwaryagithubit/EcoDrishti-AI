export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

/**
 * Set a base URL that is prepended to every relative request URL
 * (i.e. paths that start with `/`).
 *
 * Useful for Expo bundles that need to call a remote API server.
 * Pass `null` to clear the base URL.
 */
export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 *
 * NOTE: This function should never be used in web applications where session
 * token cookies are automatically associated with API calls by the browser.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const absolute = `${_baseUrl}${url}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

// Use strict equality: in browsers, `response.body` is `null` when the
// response genuinely has no content.  In React Native, `response.body` is
// always `undefined` because the ReadableStream API is not implemented —
// even when the response carries a full payload readable via `.text()` or
// `.json()`.  Loose equality (`== null`) matches both `null` and `undefined`,
// which causes every React Native response to be treated as empty.
function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  // Fall back to text when blob() is unavailable (e.g. some React Native builds).
  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

const LOCAL_DEMO_PREFIX = "local:";
const LOCAL_USER_KEY = "eco_user";
const LOCAL_POSTS_KEY = "eco_mock_posts";
const LOCAL_RESOURCES_KEY = "eco_mock_resources";
const LOCAL_CHALLENGES_KEY = "eco_mock_challenges";
const LOCAL_SUBMISSIONS_KEY = "eco_mock_submissions";
const LOCAL_REPORTS_KEY = "eco_mock_reports";
const LOCAL_LEAGUE_KEY = "eco_mock_league";
const LOCAL_RECOMMENDATIONS_KEY = "eco_mock_recommendations";

const DEMO_USER = {
  id: 1,
  name: "Rajesh Sharma",
  email: "admin@ecodrishti.edu",
  schoolName: "Shanti Secondary School",
  role: "admin",
  ecoPoints: 250,
  badge: "Climate Leader",
  createdAt: new Date().toISOString(),
};

const DEMO_SUMMARY = {
  totalEmissionsKg: 957,
  sustainabilityScore: 78,
  activeStudents: 460,
  challengesCompleted: 3,
  carbonReductionPercent: 8.4,
  dataConfidenceScore: 87,
  ecoLeagueRank: 3,
  totalSchools: 10,
  transportEmissionsKg: 690,
  electricityEmissionsKg: 122,
  waterEmissionsKg: 13,
  wasteEmissionsKg: 132,
};

const DEMO_TREND = [
  { month: "Jan", year: 2026, totalKg: 1092, transportKg: 784, electricityKg: 134, waterKg: 15, wasteKg: 159 },
  { month: "Feb", year: 2026, totalKg: 1044, transportKg: 760, electricityKg: 130, waterKg: 14, wasteKg: 140 },
  { month: "Mar", year: 2026, totalKg: 1030, transportKg: 740, electricityKg: 128, waterKg: 13, wasteKg: 149 },
  { month: "Apr", year: 2026, totalKg: 1089, transportKg: 792, electricityKg: 136, waterKg: 15, wasteKg: 146 },
  { month: "May", year: 2026, totalKg: 1044, transportKg: 760, electricityKg: 130, waterKg: 14, wasteKg: 140 },
  { month: "Jun", year: 2026, totalKg: 957, transportKg: 690, electricityKg: 122, waterKg: 13, wasteKg: 132 },
];

const DEMO_POSTS = [
  { id: 99901, authorName: "Sita Sharma", authorRole: "teacher", category: "achievement", content: "Excited to share that our school reduced electricity usage by 18% this month! LED lights in all classrooms and strict shutdown routine after class. 🌱", ecoPointsEarned: 50, likes: 14, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 99902, authorName: "Ram Bahadur", authorRole: "student", category: "tip", content: "Small tip: keep a water bottle at your desk instead of using cups. Our class saved an estimated 200 single-use cups this week alone! 💧", ecoPointsEarned: 30, likes: 22, createdAt: new Date(Date.now() - 3600000 * 26).toISOString() },
  { id: 99903, authorName: "Ms. Poudel", authorRole: "teacher", category: "question", content: "Has any school successfully set up a rainwater harvesting system? We\'re planning to install one and would love advice on the setup costs and logistics in Nepal.", ecoPointsEarned: null, likes: 8, createdAt: new Date(Date.now() - 3600000 * 72).toISOString() },
  { id: 99904, authorName: "Eco Club Members", authorRole: "student", category: "celebration", content: "🎉 We just completed the \"Walk to School Week\" challenge with 94% participation! 485 students walked or cycled for 5 consecutive days. Proud of our school family!", ecoPointsEarned: 100, likes: 47, createdAt: new Date(Date.now() - 3600000 * 120).toISOString() },
  { id: 99905, authorName: "Principal KC", authorRole: "admin", category: "awareness", content: "Reminder: the national Eco League rankings update on the 1st of each month. Our school is currently #3 nationally. Let\'s keep pushing! Every action counts. 🏆", ecoPointsEarned: 20, likes: 31, createdAt: new Date(Date.now() - 3600000 * 200).toISOString() },
];

const DEMO_RESOURCES = [
  { id: 99801, title: "Class 9 Science Textbook (Set of 5)", description: "Lightly used. Perfect condition. Sharing to reduce waste and help neighbouring schools.", resourceType: "reference_book", condition: "excellent", available: true, donorName: "Sita Sharma", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 99802, title: "Digital Multimeter (Fluke 101)", description: "Lab-grade multimeter. Used by electronics students for 2 years. Still fully functional.", resourceType: "lab_equipment", condition: "good", available: true, donorName: "Physics Dept, SHS", createdAt: new Date(Date.now() - 3600000 * 30).toISOString() },
  { id: 99803, title: "Environmental Science Revision Kit", description: "Includes flashcards, practice papers, and notes for Grade 11 & 12 environment curriculum.", resourceType: "exam_material", condition: "good", available: false, donorName: "Ram Bahadur", createdAt: new Date(Date.now() - 3600000 * 100).toISOString() },
  { id: 99804, title: "Solar Energy Working Model Kit", description: "Student-built working model for solar energy demonstration. Ideal for science fairs.", resourceType: "educational_tool", condition: "excellent", available: true, donorName: "Eco Club", createdAt: new Date(Date.now() - 3600000 * 200).toISOString() },
];

const DEMO_CHALLENGES = [
  { id: 1, title: "Walk-to-School Week", titleNp: "विद्यालयमा हिँड्ने सप्ताह", description: "All students walk or cycle to school for a full week. Track participation and celebrate results!", descriptionNp: "सबै विद्यार्थीहरू एक हप्ता विद्यालयमा हिँड्ने वा साइकल चलाउने।", category: "transport", durationDays: 7, ecoPointsReward: 100, co2AvoidedKg: 280, participantCount: 45, status: "active", isJoined: true, isCompleted: false, startDate: new Date(Date.now() - 86400000 * 2).toISOString(), endDate: new Date(Date.now() + 86400000 * 5).toISOString() },
  { id: 2, title: "Energy Saving Week", titleNp: "ऊर्जा बचत सप्ताह", description: "Turn off all lights and fans when not in use. Target: 20% electricity reduction.", descriptionNp: "प्रयोगमा नभएका बत्ती र पंखाहरू बन्द गर्नुहोस्। लक्ष्य: २०% बिजुली कटौती।", category: "energy", durationDays: 7, ecoPointsReward: 80, co2AvoidedKg: 320, participantCount: 52, status: "active", isJoined: false, isCompleted: false, startDate: new Date(Date.now() - 86400000 * 2).toISOString(), endDate: new Date(Date.now() + 86400000 * 5).toISOString() },
  { id: 3, title: "Plastic-Free Lunch", titleNp: "प्लास्टिक-मुक्त खाजा", description: "No single-use plastic during lunch for a full month. Use reusable containers only.", descriptionNp: "खाजाको समयमा एकल-प्रयोग प्लास्टिक नहोस्।", category: "waste", durationDays: 30, ecoPointsReward: 150, co2AvoidedKg: 180, participantCount: 85, status: "active", isJoined: true, isCompleted: true, startDate: new Date(Date.now() - 86400000 * 2).toISOString(), endDate: new Date(Date.now() + 86400000 * 5).toISOString() },
  { id: 4, title: "Water Conservation Drive", titleNp: "जल संरक्षण अभियान", description: "Reduce water waste by fixing leaks and promoting mindful usage.", descriptionNp: "चुहावट मर्मत गरेर पानी बर्बादी घटाउनुहोस्।", category: "water", durationDays: 14, ecoPointsReward: 60, co2AvoidedKg: 90, participantCount: 25, status: "upcoming", isJoined: false, isCompleted: false, startDate: new Date(Date.now() + 86400000 * 7).toISOString(), endDate: new Date(Date.now() + 86400000 * 21).toISOString() },
  { id: 5, title: "Green School Garden", titleNp: "हरित विद्यालय बगैंचा", description: "Plant trees and maintain a school garden to improve biodiversity.", descriptionNp: "जैविक विविधता सुधार गर्न रुख रोप्नुहोस्।", category: "biodiversity", durationDays: 21, ecoPointsReward: 120, co2AvoidedKg: 60, participantCount: 35, status: "upcoming", isJoined: false, isCompleted: false, startDate: new Date(Date.now() + 86400000 * 7).toISOString(), endDate: new Date(Date.now() + 86400000 * 21).toISOString() },
  { id: 6, title: "Zero-Waste Day", titleNp: "शून्य-फोहोर दिन", description: "One full day with zero waste sent to landfill. Compost, recycle, reuse everything!", descriptionNp: "ल्यान्डफिलमा शून्य फोहोर पठाउने एक पूर्ण दिन।", category: "waste", durationDays: 1, ecoPointsReward: 50, co2AvoidedKg: 200, participantCount: 15, status: "completed", isJoined: true, isCompleted: true, startDate: new Date(Date.now() - 86400000 * 30).toISOString(), endDate: new Date(Date.now() - 86400000 * 23).toISOString() },
];

const DEMO_LEAGUE = [
  { id: 1, schoolName: "Budhanilkantha School", rank: 1, sustainabilityScore: 91.2, carbonReductionPercent: 22.5, participationRate: 88, challengeCompletionRate: 90, dataConfidenceScore: 95, tier: "Climate Champion", schoolType: "private", location: "Kathmandu" },
  { id: 2, schoolName: "Lalitpur Secondary School", rank: 2, sustainabilityScore: 85.7, carbonReductionPercent: 18.3, participationRate: 82, challengeCompletionRate: 85, dataConfidenceScore: 88, tier: "Climate Champion", schoolType: "government", location: "Lalitpur" },
  { id: 3, schoolName: "Shanti Secondary School", rank: 3, sustainabilityScore: 78.4, carbonReductionPercent: 12.1, participationRate: 75, challengeCompletionRate: 80, dataConfidenceScore: 85, tier: "Climate Leader", schoolType: "government", location: "Kathmandu", isCurrentSchool: true },
  { id: 4, schoolName: "Tripadhi High School", rank: 4, sustainabilityScore: 72.1, carbonReductionPercent: 9.8, participationRate: 68, challengeCompletionRate: 72, dataConfidenceScore: 76, tier: "Climate Leader", schoolType: "community", location: "Bhaktapur" },
  { id: 5, schoolName: "Nepal Adarsha School", rank: 5, sustainabilityScore: 65.3, carbonReductionPercent: 7.2, participationRate: 62, challengeCompletionRate: 65, dataConfidenceScore: 70, tier: "Climate Achiever", schoolType: "government", location: "Pokhara" },
  { id: 6, schoolName: "Mount Everest Academy", rank: 6, sustainabilityScore: 58.9, carbonReductionPercent: 5.1, participationRate: 55, challengeCompletionRate: 60, dataConfidenceScore: 65, tier: "Climate Achiever", schoolType: "private", location: "Kathmandu" },
  { id: 7, schoolName: "Janata Secondary School", rank: 7, sustainabilityScore: 51.2, carbonReductionPercent: 3.4, participationRate: 48, challengeCompletionRate: 52, dataConfidenceScore: 58, tier: "Climate Achiever", schoolType: "community", location: "Chitwan" },
  { id: 8, schoolName: "Birendra Vidyalaya", rank: 8, sustainabilityScore: 44.7, carbonReductionPercent: 1.2, participationRate: 40, challengeCompletionRate: 44, dataConfidenceScore: 50, tier: "Climate Starter", schoolType: "government", location: "Butwal" },
  { id: 9, schoolName: "Sagarmatha School", rank: 9, sustainabilityScore: 38.1, carbonReductionPercent: -1.5, participationRate: 35, challengeCompletionRate: 38, dataConfidenceScore: 42, tier: "Climate Starter", schoolType: "government", location: "Dharan" },
  { id: 10, schoolName: "Rara Model School", rank: 10, sustainabilityScore: 31.5, carbonReductionPercent: -3.2, participationRate: 28, challengeCompletionRate: 32, dataConfidenceScore: 35, tier: "Climate Starter", schoolType: "community", location: "Surkhet" },
];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function ensureStore<T>(key: string, fallback: T): T {
  const current = readJson<T | null>(key, null);
  if (current != null) return current;
  writeJson(key, fallback);
  return fallback;
}

function readLocalUser() {
  return readJson(LOCAL_USER_KEY, DEMO_USER);
}

function getDemoState() {
  return {
    user: readLocalUser(),
    submissions: ensureStore(LOCAL_SUBMISSIONS_KEY, [
      {
        id: 101,
        month: 5,
        year: 2026,
        totalEmissionsKg: 1044,
        transportEmissionsKg: 760,
        electricityEmissionsKg: 130,
        waterEmissionsKg: 14,
        wasteEmissionsKg: 140,
        sustainabilityScore: 72,
        dataConfidenceScore: 86,
        status: "verified",
        notes: "Seeded demo month",
        studentCount: 445,
        staffCount: 35,
        createdAt: new Date(Date.now() - 86400000 * 32).toISOString(),
      },
      {
        id: 102,
        month: 6,
        year: 2026,
        totalEmissionsKg: 957,
        transportEmissionsKg: 690,
        electricityEmissionsKg: 122,
        waterEmissionsKg: 13,
        wasteEmissionsKg: 132,
        sustainabilityScore: 78,
        dataConfidenceScore: 87,
        status: "verified",
        notes: "Latest demo month",
        studentCount: 460,
        staffCount: 35,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ]),
    reports: ensureStore(LOCAL_REPORTS_KEY, [
      { id: 201, month: 6, year: 2026, sustainabilityScore: 78, totalEmissionsKg: 957, carbonReductionPercent: 8.4, ecoLeagueRank: 3, activeStudents: 460, challengesCompleted: 3, transportEmissionsKg: 690, electricityEmissionsKg: 122, waterEmissionsKg: 13, wasteEmissionsKg: 132, highlights: ["Walk-to-School Week achieved 94% participation", "Electricity reduced by 5% via LED replacements", "Compost bin launched in school garden — 28 kg diverted from landfill"], createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 202, month: 5, year: 2026, sustainabilityScore: 72, totalEmissionsKg: 1044, carbonReductionPercent: 4.2, ecoLeagueRank: 4, activeStudents: 445, challengesCompleted: 2, transportEmissionsKg: 760, electricityEmissionsKg: 130, waterEmissionsKg: 14, wasteEmissionsKg: 140, highlights: ["Plastic-free lunch day launched — 320 students participated", "New energy monitors assigned to each classroom", "School ranked #4 nationally — up from #6 last month"], createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    ]),
    posts: ensureStore(LOCAL_POSTS_KEY, DEMO_POSTS),
    resources: ensureStore(LOCAL_RESOURCES_KEY, DEMO_RESOURCES),
    challenges: ensureStore(LOCAL_CHALLENGES_KEY, DEMO_CHALLENGES),
    league: ensureStore(LOCAL_LEAGUE_KEY, DEMO_LEAGUE),
    recommendations: ensureStore(LOCAL_RECOMMENDATIONS_KEY, [] as any[]),
  };
}

function saveDemoState(partial: Partial<ReturnType<typeof getDemoState>>): void {
  if (partial.submissions) writeJson(LOCAL_SUBMISSIONS_KEY, partial.submissions);
  if (partial.reports) writeJson(LOCAL_REPORTS_KEY, partial.reports);
  if (partial.posts) writeJson(LOCAL_POSTS_KEY, partial.posts);
  if (partial.resources) writeJson(LOCAL_RESOURCES_KEY, partial.resources);
  if (partial.challenges) writeJson(LOCAL_CHALLENGES_KEY, partial.challenges);
  if (partial.league) writeJson(LOCAL_LEAGUE_KEY, partial.league);
  if (partial.recommendations) writeJson(LOCAL_RECOMMENDATIONS_KEY, partial.recommendations);
}

function parseBody(body: BodyInit | null | undefined): any {
  if (typeof body !== "string" || body.trim() === "") return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function localTokenFromHeaders(headers: Headers): string | null {
  const authorization = headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  return token.startsWith(LOCAL_DEMO_PREFIX) ? token : null;
}

function calculateSubmission(input: any, id: number) {
  const schoolDays = 22;
  const studentCount = Number(input.studentCount ?? 0);
  const staffCount = Number(input.staffCount ?? 0);
  const electricityKwh = Number(input.electricityKwh ?? 0);
  const waterLiters = Number(input.waterLiters ?? 0);
  const wasteKg = Number(input.wasteKg ?? 0);
  const recyclingKg = Number(input.recyclingKg ?? 0);
  const compostingKg = Number(input.compostingKg ?? 0);
  const busRiders = Number(input.busRiders ?? 0);
  const carRiders = Number(input.carRiders ?? 0);
  const fuelLiters = Number(input.fuelLiters ?? 0);
  const electricity = electricityKwh * 0.04;
  const water = waterLiters * 0.0003;
  const landfill = Math.max(0, wasteKg - recyclingKg - compostingKg);
  const waste = landfill * 0.5;
  const transport = busRiders * schoolDays * 0.05 + carRiders * schoolDays * 0.12 + fuelLiters * 2.31;
  const totalEmissionsKg = electricity + water + waste + transport;
  const people = studentCount + staffCount;
  const sustainabilityScore = Math.max(0, Math.min(100, 100 - (people > 0 ? totalEmissionsKg / people : 0) * 5));

  return {
    id,
    month: Number(input.month ?? new Date().getMonth() + 1),
    year: Number(input.year ?? new Date().getFullYear()),
    totalEmissionsKg,
    transportEmissionsKg: transport,
    electricityEmissionsKg: electricity,
    waterEmissionsKg: water,
    wasteEmissionsKg: waste,
    sustainabilityScore,
    dataConfidenceScore: 85,
    status: "verified",
    notes: input.notes ?? null,
    studentCount,
    staffCount,
    createdAt: new Date().toISOString(),
  };
}

function generateRecommendationsFromSubmission(submission: any) {
  const recommendations = [] as any[];
  if ((submission?.transportEmissionsKg ?? 0) > 200) {
    recommendations.push({ id: 1, category: "transport", title: "Shift More Students to Walking/Cycling", titleNp: "अधिक विद्यार्थीलाई हिँड्ने/साइकलमा स्थानान्तरण गर्नुहोस्", description: "Increase walk/cycle share by 10% — reduces transport emissions significantly.", descriptionNp: "हिँड्ने/साइकल अंश १०% बढाउनुहोस् — यातायात उत्सर्जन उल्लेखनीय रूपमा घट्छ।", estimatedCarbonReductionKg: (submission.transportEmissionsKg ?? 0) * 0.12, difficulty: "medium", impact: "high", timeline: "4 weeks", status: "active", createdAt: new Date().toISOString() });
  }
  if ((submission?.electricityEmissionsKg ?? 0) > 100) {
    recommendations.push({ id: 2, category: "electricity", title: "Install Solar Panels & LED Lighting", titleNp: "सोलार प्यानल र LED बत्ती जडान गर्नुहोस्", description: "Switch to solar and replace all fluorescent lights with LED to cut electricity by 60%.", descriptionNp: "सोलारमा स्विच गर्नुहोस् र सबै बत्तीलाई LED ले प्रतिस्थापन गरी बिजुली ६०% घटाउनुहोस्।", estimatedCarbonReductionKg: (submission.electricityEmissionsKg ?? 0) * 0.6, difficulty: "hard", impact: "high", timeline: "2-3 months", status: "active", createdAt: new Date().toISOString() });
  }
  if ((submission?.wasteEmissionsKg ?? 0) > 50) {
    recommendations.push({ id: 3, category: "waste", title: "Full Waste Segregation & Composting", titleNp: "पूर्ण फोहोर पृथकीकरण र कम्पोस्टिङ", description: "Move from landfill to compost — divert 80% of organic waste from landfill.", descriptionNp: "ल्यान्डफिलबाट कम्पोस्टमा जानुहोस् — ८०% जैविक फोहोर ल्यान्डफिलबाट हटाउनुहोस्।", estimatedCarbonReductionKg: (submission.wasteEmissionsKg ?? 0) * 0.6, difficulty: "easy", impact: "medium", timeline: "3 weeks", status: "active", createdAt: new Date().toISOString() });
  }
  if (recommendations.length < 3) {
    recommendations.push({ id: 4, category: "general", title: "Monthly Carbon Monitoring Program", titleNp: "मासिक कार्बन अनुगमन कार्यक्रम", description: "Track emissions monthly and set reduction targets — builds accountability.", descriptionNp: "मासिक उत्सर्जन ट्र्याक गर्नुहोस् र कटौती लक्ष्य राख्नुहोस्।", estimatedCarbonReductionKg: (submission?.totalEmissionsKg ?? 0) * 0.05, difficulty: "easy", impact: "low", timeline: "Ongoing", status: "active", createdAt: new Date().toISOString() });
  }
  return recommendations.slice(0, 5);
}

function buildMonthlyReport(submission: any, id: number) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentUser = readLocalUser();
  return {
    id,
    month: submission.month,
    year: submission.year,
    totalEmissionsKg: submission.totalEmissionsKg,
    sustainabilityScore: submission.sustainabilityScore,
    dataConfidenceScore: submission.dataConfidenceScore,
    ecoLeagueRank: 3,
    highlights: [
      `Carbon report generated for ${monthNames[(submission.month ?? 1) - 1]} ${submission.year}`,
      `School: ${currentUser.schoolName}`,
      `Transport and waste remain the biggest opportunities for improvement.`,
    ],
    challengesCompleted: 3,
    activeStudents: submission.studentCount,
    carbonReductionPercent: 8.4,
    transportEmissionsKg: submission.transportEmissionsKg,
    electricityEmissionsKg: submission.electricityEmissionsKg,
    waterEmissionsKg: submission.waterEmissionsKg,
    wasteEmissionsKg: submission.wasteEmissionsKg,
    createdAt: new Date().toISOString(),
  };
}

async function handleLocalDemoRequest(url: string, method: string, headers: Headers, body: BodyInit | null | undefined): Promise<unknown | undefined> {
  const path = new URL(url, "http://local.demo").pathname;
  const payload = parseBody(body);

  if (path === "/api/healthz") return { status: "ok" };

  if (path === "/api/auth/login" && method === "POST") {
    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    if (email === DEMO_USER.email && password === "password123") {
      writeJson(LOCAL_USER_KEY, DEMO_USER);
      return { user: DEMO_USER, token: `${LOCAL_DEMO_PREFIX}${Date.now()}` };
    }
    throw new ApiError(new Response(null, { status: 401, statusText: "Unauthorized" }), { error: "Invalid credentials" }, { method, url });
  }

  if (path === "/api/auth/register" && method === "POST") {
    const user = {
      id: Date.now(),
      name: payload.name ?? "New User",
      email: String(payload.email ?? "new@example.com"),
      schoolName: payload.schoolName ?? "Demo School",
      role: payload.role ?? "admin",
      ecoPoints: 0,
      badge: null,
      createdAt: new Date().toISOString(),
    };
    writeJson(LOCAL_USER_KEY, user);
    return { user, token: `${LOCAL_DEMO_PREFIX}${Date.now()}` };
  }

  const state = getDemoState();
  const hasDemoToken = !!localTokenFromHeaders(headers);
  if (!hasDemoToken && path !== "/api/auth/me") return undefined;

  if (path === "/api/auth/me") return state.user;

  if (path === "/api/auth/logout" && method === "POST") return { success: true };
  if (path === "/api/dashboard/summary") return DEMO_SUMMARY;
  if (path === "/api/dashboard/emissions-trend") return DEMO_TREND;

  if (path === "/api/dashboard/category-breakdown") {
    const total = DEMO_SUMMARY.totalEmissionsKg;
    return [
      { category: "Transport", emissionsKg: DEMO_SUMMARY.transportEmissionsKg, percentage: Math.round((DEMO_SUMMARY.transportEmissionsKg / total) * 100), color: "#10b981" },
      { category: "Electricity", emissionsKg: DEMO_SUMMARY.electricityEmissionsKg, percentage: Math.round((DEMO_SUMMARY.electricityEmissionsKg / total) * 100), color: "#f97316" },
      { category: "Water", emissionsKg: DEMO_SUMMARY.waterEmissionsKg, percentage: Math.round((DEMO_SUMMARY.waterEmissionsKg / total) * 100), color: "#3b82f6" },
      { category: "Waste", emissionsKg: DEMO_SUMMARY.wasteEmissionsKg, percentage: Math.round((DEMO_SUMMARY.wasteEmissionsKg / total) * 100), color: "#8b5cf6" },
    ];
  }

  if (path === "/api/carbon/submissions" && method === "GET") return state.submissions;

  if (path === "/api/carbon/submissions" && method === "POST") {
    const submission = calculateSubmission(payload, Date.now());
    const submissions = [submission, ...state.submissions].slice(0, 12);
    const reports = [buildMonthlyReport(submission, Date.now()), ...state.reports].slice(0, 12);
    saveDemoState({ submissions, reports });
    return submission;
  }

  if (path.startsWith("/api/carbon/submissions/") && method === "GET") {
    const id = Number(path.split("/").pop());
    return state.submissions.find((item: any) => item.id === id) ?? state.submissions[0] ?? null;
  }

  if (path === "/api/recommendations" && method === "GET") {
    return state.recommendations.length > 0 ? state.recommendations : generateRecommendationsFromSubmission(state.submissions[0]);
  }

  if (path === "/api/recommendations/generate" && method === "POST") {
    const submissionId = Number(payload.submissionId ?? state.submissions[0]?.id ?? 0);
    const submission = state.submissions.find((item: any) => item.id === submissionId) ?? state.submissions[0];
    const recommendations = generateRecommendationsFromSubmission(submission);
    saveDemoState({ recommendations });
    return recommendations;
  }

  if (path === "/api/reports" && method === "GET") return state.reports;

  if (path === "/api/reports/generate" && method === "POST") {
    const month = Number(payload.month ?? new Date().getMonth() + 1);
    const year = Number(payload.year ?? new Date().getFullYear());
    const submission = state.submissions.find((item: any) => item.month === month && item.year === year) ?? state.submissions[0];
    const report = buildMonthlyReport(submission, Date.now());
    report.month = month;
    report.year = year;
    const reports = [report, ...state.reports.filter((item: any) => !(item.month === month && item.year === year))].slice(0, 12);
    saveDemoState({ reports });
    return report;
  }

  if (path === "/api/community/posts" && method === "GET") return state.posts;

  if (path === "/api/community/posts" && method === "POST") {
    const post = {
      id: Date.now(),
      authorName: state.user.name,
      authorRole: state.user.role,
      content: payload.content,
      category: payload.category,
      likes: 0,
      ecoPointsEarned: payload.category === "achievement" ? 50 : 10,
      createdAt: new Date().toISOString(),
      imageUrl: payload.imageUrl ?? null,
    };
    saveDemoState({ posts: [post, ...state.posts] });
    return post;
  }

  if (path.endsWith("/like") && path.startsWith("/api/community/posts/") && method === "POST") {
    const id = Number(path.split("/")[4]);
    const posts = state.posts.map((post: any) => (post.id === id ? { ...post, likes: (post.likes ?? 0) + 1 } : post));
    saveDemoState({ posts });
    return posts.find((post: any) => post.id === id) ?? null;
  }

  if (path === "/api/community/resources" && method === "GET") return state.resources;

  if (path === "/api/community/resources" && method === "POST") {
    const resource = {
      id: Date.now(),
      title: payload.title,
      description: payload.description,
      resourceType: payload.resourceType,
      condition: payload.condition,
      donorName: state.user.name,
      available: true,
      requestedBy: null,
      createdAt: new Date().toISOString(),
    };
    saveDemoState({ resources: [resource, ...state.resources] });
    return resource;
  }

  if (path === "/api/challenges" && method === "GET") return state.challenges;

  if (path.startsWith("/api/challenges/") && path.endsWith("/join") && method === "POST") {
    const id = Number(path.split("/")[3]);
    const challenges = state.challenges.map((challenge: any) => (challenge.id === id ? { ...challenge, isJoined: true } : challenge));
    saveDemoState({ challenges });
    return challenges.find((challenge: any) => challenge.id === id) ?? null;
  }

  if (path.startsWith("/api/challenges/") && path.endsWith("/complete") && method === "POST") {
    const id = Number(path.split("/")[3]);
    const challenges = state.challenges.map((challenge: any) => (challenge.id === id ? { ...challenge, isJoined: true, isCompleted: true, status: "completed" } : challenge));
    saveDemoState({ challenges });
    return challenges.find((challenge: any) => challenge.id === id) ?? null;
  }

  if (path === "/api/league/rankings" && method === "GET") return state.league;
  if (path === "/api/league/my-school" && method === "GET") return state.league.find((school: any) => school.isCurrentSchool) ?? state.league[0] ?? null;

  return undefined;
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  input = applyBaseUrl(input);
  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = resolveMethod(input, init.method);

  if (init.body != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  // Attach bearer token when an auth getter is configured and no
  // Authorization header has been explicitly provided.
  if (_authTokenGetter && !headers.has("authorization")) {
    const token = await _authTokenGetter();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const requestInfo = { method, url: resolveUrl(input) };

  const localDemoResult = await handleLocalDemoRequest(requestInfo.url, method, headers, init.body ?? null);
  if (localDemoResult !== undefined) {
    return localDemoResult as T;
  }

  const response = await fetch(input, { ...init, method, headers });

  if (!response.ok) {
    const errorData = await parseErrorBody(response, method);
    throw new ApiError(response, errorData, requestInfo);
  }

  return (await parseSuccessBody(response, responseType, requestInfo)) as T;
}
