export type DayCode = "M" | "T" | "W" | "R" | "F";
export type Campus = "Tampa" | "St. Petersburg" | "Sarasota-Manatee" | "Online";

export interface ProfessorRating {
  name: string;
  rmpScore: number;
  rmpDifficulty: number;
  wouldTakeAgain: number;
  rmpCount: number;
  coursicleScore: number;
  coursicleStatus: "Open" | "Waitlist" | "Closed";
}

export interface CourseSection {
  crn: string;
  sectionCode: string;
  courseCode: string;
  days: DayCode[];
  startMin: number;
  endMin: number;
  campus: Campus;
  location: string;
  seatsOpen: number;
  seatsTotal: number;
  professor: ProfessorRating;
}

export interface DegreeCourse {
  code: string;
  title: string;
  credits: number;
  termRecommended: string;
  category: "Core" | "Major" | "Elective";
  catalogUrl: string;
  sections: CourseSection[];
}

export interface DegreePlan {
  id: string;
  name: string;
  college: string;
  catalogYear: string;
  catalogUrl: string;
  courses: DegreeCourse[];
}

export const CURRENT_TERM = "Spring 2027";

function sec(
  crn: string,
  sectionCode: string,
  courseCode: string,
  days: DayCode[],
  startMin: number,
  endMin: number,
  campus: Campus,
  location: string,
  seatsOpen: number,
  seatsTotal: number,
  name: string,
  rmpScore: number,
  rmpDifficulty: number,
  wouldTakeAgain: number,
  rmpCount: number,
  coursicleScore: number,
): CourseSection {
  const coursicleStatus: ProfessorRating["coursicleStatus"] =
    seatsOpen > 0 ? "Open" : seatsOpen === 0 ? "Waitlist" : "Closed";
  return {
    crn, sectionCode, courseCode, days, startMin, endMin, campus, location, seatsOpen, seatsTotal,
    professor: { name, rmpScore, rmpDifficulty, wouldTakeAgain, rmpCount, coursicleScore, coursicleStatus },
  };
}

function crs(
  code: string,
  title: string,
  credits: number,
  termRecommended: string,
  category: DegreeCourse["category"],
  sections: CourseSection[],
): DegreeCourse {
  const slug = encodeURIComponent(code);
  return {
    code, title, credits, termRecommended, category,
    catalogUrl: `https://catalog.usf.edu/search_advanced.php?cur_cat_oid=21&filter%5Bkeyword%5D=${slug}`,
    sections,
  };
}

export const USF_DEGREE_PLANS: DegreePlan[] = [
  {
    id: "cs",
    name: "Computer Science (B.S.)",
    college: "College of Engineering",
    catalogYear: "2026–2027 USF Catalog",
    catalogUrl: "https://catalog.usf.edu/preview_program.php?catoid=21&poid=10162",
    courses: [
      crs("COP 4530", "Data Structures", 3, "Sem 4", "Core", [
        sec("14821", "001", "COP 4530", ["M", "W"], 570, 645, "Tampa", "ENB 118", 9, 95, "Dr. Korzhova", 4.6, 3.1, 91, 84, 4.7),
        sec("14822", "002", "COP 4530", ["T", "R"], 750, 825, "Tampa", "ENG 004", 0, 90, "Dr. Hendrix", 4.8, 2.9, 95, 112, 4.8),
        sec("14823", "003", "COP 4530", ["M", "W"], 840, 915, "Tampa", "ENB 116", 18, 85, "Dr. Patel", 3.4, 3.8, 62, 49, 3.5),
      ]),
      crs("CDA 3103", "Computer Organization", 3, "Sem 4", "Core", [
        sec("15104", "001", "CDA 3103", ["T", "R"], 660, 735, "Tampa", "ENB 109", 14, 110, "Dr. Zheng", 4.5, 3.2, 88, 76, 4.4),
        sec("15105", "002", "CDA 3103", ["M", "W"], 510, 585, "Tampa", "ENG 103", 22, 100, "Dr. Morales", 3.9, 3.5, 74, 53, 4.0),
      ]),
      crs("COT 4400", "Analysis of Algorithms", 3, "Sem 5", "Major", [
        sec("15412", "001", "COT 4400", ["T", "R"], 840, 915, "Tampa", "ENB 118", 11, 80, "Dr. Small", 4.7, 3.4, 92, 95, 4.6),
        sec("15413", "002", "COT 4400", ["M", "W"], 660, 735, "Tampa", "ENG 004", 6, 80, "Dr. Lin", 4.2, 3.6, 81, 61, 4.3),
      ]),
      crs("COP 4600", "Operating Systems", 3, "Sem 5", "Major", [
        sec("15690", "001", "COP 4600", ["M", "W"], 750, 825, "Tampa", "ENB 109", 7, 90, "Dr. Christensen", 4.8, 3.5, 94, 138, 4.9),
        sec("15691", "002", "COP 4600", ["T", "R"], 570, 645, "Tampa", "ENB 116", 19, 90, "Dr. Alvarez", 3.7, 3.9, 68, 42, 3.8),
      ]),
      crs("CIS 4250", "Ethical Issues & Prof. Conduct", 3, "Sem 5", "Core", [
        sec("15880", "901", "CIS 4250", [], 0, 0, "Online", "Canvas Async", 25, 120, "Prof. Callahan", 4.7, 1.9, 96, 68, 4.6),
        sec("15881", "001", "CIS 4250", ["F"], 600, 750, "Tampa", "CHE 100", 12, 70, "Prof. Rivers", 4.1, 2.3, 83, 31, 4.2),
      ]),
      crs("CAP 4630", "Intro to Artificial Intelligence", 3, "Sem 6", "Elective", [
        sec("16201", "001", "CAP 4630", ["T", "R"], 930, 1005, "Tampa", "ENB 118", 5, 75, "Dr. Sun", 4.6, 3.0, 90, 64, 4.7),
        sec("16202", "002", "CAP 4630", ["M", "W"], 930, 1005, "Tampa", "ENG 004", 16, 75, "Dr. Okafor", 4.3, 3.2, 85, 39, 4.4),
      ]),
    ],
  },
  {
    id: "bms",
    name: "Biomedical Sciences (B.S.)",
    college: "College of Arts & Sciences",
    catalogYear: "2026–2027 USF Catalog",
    catalogUrl: "https://catalog.usf.edu/preview_program.php?catoid=21&poid=10042",
    courses: [
      crs("CHM 2210", "Organic Chemistry I", 3, "Sem 3", "Core", [
        sec("21011", "001", "CHM 2210", ["M", "W", "F"], 600, 650, "Tampa", "CHE 100", 12, 180, "Dr. Fields", 4.5, 3.9, 89, 214, 4.6),
        sec("21012", "002", "CHM 2210", ["T", "R"], 510, 585, "Tampa", "BSN 1100", 24, 160, "Dr. Cruz", 3.6, 4.3, 64, 142, 3.7),
      ]),
      crs("PCB 3063", "General Genetics", 3, "Sem 4", "Major", [
        sec("21402", "001", "PCB 3063", ["T", "R"], 660, 735, "Tampa", "ISA 1061", 8, 150, "Dr. El-Rady", 4.8, 3.2, 95, 310, 4.9),
        sec("21403", "002", "PCB 3063", ["M", "W"], 840, 915, "Tampa", "SCA 110", 0, 140, "Dr. Park", 4.4, 3.4, 86, 88, 4.5),
      ]),
      crs("BCH 3053", "General Biochemistry", 3, "Sem 5", "Major", [
        sec("21755", "001", "BCH 3053", ["M", "W"], 750, 825, "Tampa", "CHE 100", 15, 160, "Dr. Daniel", 4.6, 3.6, 90, 175, 4.7),
        sec("21756", "002", "BCH 3053", ["T", "R"], 840, 915, "Tampa", "ISA 1061", 19, 150, "Dr. Meyer", 3.9, 4.0, 72, 91, 4.0),
      ]),
      crs("MCB 3020", "General Microbiology", 3, "Sem 5", "Major", [
        sec("22018", "001", "MCB 3020", ["T", "R"], 750, 825, "Tampa", "BSN 1100", 11, 140, "Dr. Riordan", 4.7, 3.1, 93, 129, 4.7),
        sec("22019", "901", "MCB 3020", [], 0, 0, "Online", "Canvas Async", 30, 180, "Dr. Bellamy", 4.3, 2.8, 86, 97, 4.4),
      ]),
      crs("PHY 2053", "General Physics I", 3, "Sem 4", "Core", [
        sec("22310", "001", "PHY 2053", ["M", "W", "F"], 660, 710, "Tampa", "ISA 1051", 9, 130, "Dr. Criss", 4.4, 3.3, 87, 162, 4.5),
        sec("22311", "002", "PHY 2053", ["T", "R"], 930, 1005, "Tampa", "ISA 1051", 17, 130, "Dr. Novak", 3.8, 3.7, 71, 74, 3.9),
      ]),
    ],
  },
  {
    id: "fin",
    name: "Finance (B.S.)",
    college: "Muma College of Business",
    catalogYear: "2026–2027 USF Catalog",
    catalogUrl: "https://catalog.usf.edu/preview_program.php?catoid=21&poid=10198",
    courses: [
      crs("FIN 3403", "Principles of Finance", 3, "Sem 4", "Core", [
        sec("31041", "001", "FIN 3403", ["T", "R"], 660, 735, "Tampa", "BSN 1100", 14, 150, "Dr. Besley", 4.7, 3.0, 93, 198, 4.8),
        sec("31042", "901", "FIN 3403", [], 0, 0, "Online", "Canvas Async", 21, 180, "Prof. Whitaker", 4.2, 3.1, 83, 114, 4.3),
      ]),
      crs("FIN 4414", "Advanced Corporation Finance", 3, "Sem 5", "Major", [
        sec("31320", "001", "FIN 4414", ["M", "W"], 750, 825, "Tampa", "BSN 2201", 6, 65, "Dr. Qi", 4.6, 3.3, 90, 82, 4.7),
        sec("31321", "002", "FIN 4414", ["T", "R"], 510, 585, "Tampa", "BSN 2205", 19, 65, "Prof. Mercer", 3.8, 3.5, 73, 47, 3.9),
      ]),
      crs("FIN 4504", "Principles of Investments", 3, "Sem 5", "Major", [
        sec("31608", "001", "FIN 4504", ["T", "R"], 840, 915, "Tampa", "BSN 1203", 10, 70, "Dr. Sutton", 4.8, 2.9, 95, 134, 4.8),
        sec("31609", "002", "FIN 4504", ["M", "W"], 600, 675, "Tampa", "BSN 1203", 0, 70, "Dr. Kwon", 4.5, 3.1, 89, 71, 4.6),
      ]),
      crs("FIN 4303", "Financial Institutions & Markets", 3, "Sem 6", "Major", [
        sec("31914", "001", "FIN 4303", ["M", "W"], 840, 915, "Tampa", "BSN 2302", 13, 60, "Prof. Delgado", 4.4, 2.7, 88, 63, 4.5),
        sec("31915", "901", "FIN 4303", [], 0, 0, "Online", "Canvas Async", 18, 90, "Prof. Lindholm", 4.1, 2.6, 82, 52, 4.2),
      ]),
      crs("QMB 3200", "Business & Economic Statistics II", 3, "Sem 4", "Core", [
        sec("32201", "001", "QMB 3200", ["T", "R"], 750, 825, "Tampa", "BSN 1100", 16, 140, "Dr. Dummeldinger", 4.6, 2.8, 91, 165, 4.7),
        sec("32202", "002", "QMB 3200", ["M", "W"], 570, 645, "Tampa", "BSN 2104", 22, 120, "Prof. Vance", 3.9, 3.2, 76, 58, 4.0),
      ]),
    ],
  },
  {
    id: "me",
    name: "Mechanical Engineering (B.S.)",
    college: "College of Engineering",
    catalogYear: "2026–2027 USF Catalog",
    catalogUrl: "https://catalog.usf.edu/preview_program.php?catoid=21&poid=10168",
    courses: [
      crs("EML 3035", "Programming Concepts for ME", 1, "Sem 4", "Core", [
        sec("41010", "001", "EML 3035", ["F"], 600, 690, "Tampa", "ENG 103", 14, 90, "Dr. Kaw", 4.8, 2.7, 96, 240, 4.9),
        sec("41011", "901", "EML 3035", [], 0, 0, "Online", "Canvas Async", 28, 120, "Dr. Kaw", 4.8, 2.7, 96, 240, 4.9),
      ]),
      crs("EML 3701", "Fluid Systems", 3, "Sem 5", "Major", [
        sec("41305", "001", "EML 3701", ["M", "W"], 660, 735, "Tampa", "ENB 118", 9, 85, "Dr. Rahman", 4.5, 3.5, 88, 92, 4.6),
        sec("41306", "002", "EML 3701", ["T", "R"], 510, 585, "Tampa", "ENG 004", 18, 85, "Dr. Bui", 3.7, 4.0, 69, 44, 3.8),
      ]),
      crs("EML 3500", "Mechanics of Solids", 3, "Sem 4", "Major", [
        sec("41612", "001", "EML 3500", ["T", "R"], 660, 735, "Tampa", "ENB 109", 7, 90, "Dr. Gallant", 4.6, 3.4, 90, 118, 4.7),
        sec("41613", "002", "EML 3500", ["M", "W"], 840, 915, "Tampa", "ENB 109", 15, 90, "Dr. Solis", 4.0, 3.7, 77, 63, 4.1),
      ]),
      crs("EML 3041", "Computational Methods", 3, "Sem 5", "Major", [
        sec("41920", "001", "EML 3041", ["T", "R"], 840, 915, "Tampa", "ENG 004", 11, 95, "Dr. Kaw", 4.8, 3.1, 95, 240, 4.9),
        sec("41921", "002", "EML 3041", ["M", "W"], 570, 645, "Tampa", "ENB 116", 20, 95, "Dr. Reddy", 4.1, 3.4, 80, 51, 4.2),
      ]),
      crs("EML 4123", "Heat Transfer", 3, "Sem 6", "Major", [
        sec("42214", "001", "EML 4123", ["M", "W"], 750, 825, "Tampa", "ENB 118", 8, 80, "Dr. Crane", 4.4, 3.6, 85, 79, 4.5),
        sec("42215", "002", "EML 4123", ["T", "R"], 750, 825, "Tampa", "ENB 116", 0, 80, "Dr. Hassan", 4.6, 3.3, 91, 67, 4.7),
      ]),
    ],
  },
];

export function buildCustomCatalogCourse(code: string): DegreeCourse {
  const hash = code.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const crnBase = 50000 + (hash % 4000);
  return crs(code, "Imported USF Catalog Course", 3, "Catalog", "Elective", [
    sec(String(crnBase), "001", code, ["M", "W"], 660, 735, "Tampa", "TBA", 12, 60, "USF Faculty (Sec 001)", 4.3, 3.0, 85, 28, 4.4),
    sec(String(crnBase + 1), "901", code, [], 0, 0, "Online", "Canvas Async", 18, 80, "USF Faculty (Online)", 4.5, 2.8, 89, 34, 4.5),
  ]);
}

export function rmpSearchUrl(professorName: string): string {
  const clean = professorName.replace(/^(Dr\.|Prof\.)\s*/i, "");
  return `https://www.ratemyprofessors.com/search/professors/1262?q=${encodeURIComponent(clean)}`;
}

export function coursicleUrl(courseCode: string): string {
  const [dept, num] = courseCode.split(" ");
  if (dept && num) {
    return `https://www.coursicle.com/usf/courses/${encodeURIComponent(dept)}/${encodeURIComponent(num)}/`;
  }
  return "https://www.coursicle.com/usf/";
}