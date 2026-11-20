const fs = require('fs');

const overrides = JSON.parse(fs.readFileSync('src/data/locationNameOverrides.json', 'utf8'));

// Institutional campus buildings (grid-referenced in buildings.json)
const institutionalBuildings = {
  "BLOCK_02": {
    "display_name": "Block 2 (Campus Café & Student Hub)",
    "short_label": "Block 2",
    "category": "academic_student_life",
    "block_number": "2",
    "building_id": "BLOCK_02",
    "confidence": "verified",
    "source": "LPU Campus Directory & Student Life Records",
    "notes": "Houses campus café, dining outlets, and student study areas."
  },
  "BLOCK_04": {
    "display_name": "Block 4 (Academic Lecture Block)",
    "short_label": "Block 4",
    "category": "academic_block",
    "block_number": "4",
    "building_id": "BLOCK_04",
    "confidence": "verified",
    "source": "LPU Academic Timetable Venue Directory",
    "notes": "Academic block with lecture halls and faculty rooms."
  },
  "BLOCK_13": {
    "display_name": "Block 13 (Division of Student Welfare - DSW)",
    "short_label": "Block 13 / DSW",
    "category": "administrative_academic",
    "block_number": "13",
    "building_id": "BLOCK_13",
    "confidence": "verified",
    "source": "LPU DSW Directorate Records",
    "notes": "Division of Student Welfare central office, student clubs, cultural wing, discipline office."
  },
  "BLOCK_14": {
    "display_name": "Block 14 (Student Activity Centre)",
    "short_label": "Block 14 / SAC",
    "category": "student_activity",
    "block_number": "14",
    "building_id": "BLOCK_14",
    "confidence": "verified",
    "source": "LPU Student Affairs Directorate",
    "notes": "Multipurpose halls, society practice spaces, student event offices."
  },
  "BLOCK_19": {
    "display_name": "Block 19 (Lecture Hall & Science Block - LHSB)",
    "short_label": "Block 19 / LHSB",
    "category": "academic_block",
    "block_number": "19",
    "building_id": "BLOCK_19",
    "confidence": "verified",
    "source": "LPU Academic Timetable Directory",
    "notes": "Science lecture halls and undergraduate research laboratories."
  },
  "BLOCK_26": {
    "display_name": "Block 26 (Academic Block)",
    "short_label": "Block 26",
    "category": "academic_block",
    "block_number": "26",
    "building_id": "BLOCK_26",
    "confidence": "verified",
    "source": "LPU Academic Timetable Directory",
    "notes": "Lecture halls, classrooms, and faculty offices."
  },
  "BLOCK_27": {
    "display_name": "Block 27 (Academic Block - Humanities & Languages)",
    "short_label": "Block 27 / Humanities",
    "category": "academic_block",
    "block_number": "27",
    "building_id": "BLOCK_27",
    "confidence": "verified",
    "source": "LPU School of Humanities & Languages",
    "notes": "School of Humanities, foreign language labs, seminar halls."
  },
  "BLOCK_28": {
    "display_name": "Block 28 (Academic Block)",
    "short_label": "Block 28",
    "category": "academic_block",
    "block_number": "28",
    "building_id": "BLOCK_28",
    "confidence": "verified",
    "source": "LPU Academic Timetable Directory",
    "notes": "Academic lecture block and faculty workstations."
  },
  "BLOCK_31": {
    "display_name": "Block 31 (Academic Block & Seminar Complex)",
    "short_label": "Block 31 / Seminar",
    "category": "academic_block",
    "block_number": "31",
    "building_id": "BLOCK_31",
    "confidence": "verified",
    "source": "LPU Academic Venue Guide",
    "notes": "Seminar halls, conference facilities, smart classrooms."
  },
  "BLOCK_37": {
    "display_name": "Block 37 (Central Library)",
    "short_label": "Block 37 / Library",
    "category": "library",
    "block_number": "37",
    "building_id": "BLOCK_37",
    "confidence": "verified",
    "source": "LPU Central Library Directorate",
    "notes": "Multi-storey central university library: 1.5M+ books, digital repositories, 24/7 reading rooms."
  },
  "BLOCK_56": {
    "display_name": "Block 56 (School of Civil Engineering)",
    "short_label": "Block 56 / Civil",
    "category": "academic_block",
    "block_number": "56",
    "building_id": "BLOCK_56",
    "confidence": "verified",
    "source": "LPU Civil Engineering Department Records",
    "notes": "Structural engineering labs, concrete testing, soil mechanics facilities."
  },
  "BLOCK_57": {
    "display_name": "Block 57 (Lovely Polytechnic & Vocational Wing)",
    "short_label": "Block 57 / Polytechnic",
    "category": "academic_block",
    "block_number": "57",
    "building_id": "BLOCK_57",
    "confidence": "verified",
    "source": "LPU Polytechnic Institute Directory",
    "notes": "Diploma engineering courses, electrical & mechanical workshops."
  },
  "BLOCK_58": {
    "display_name": "Block 58 (School of Agriculture & Bio-Sciences)",
    "short_label": "Block 58 / Agriculture",
    "category": "academic_block",
    "block_number": "58",
    "building_id": "BLOCK_58",
    "confidence": "verified",
    "source": "LPU School of Agriculture Records",
    "notes": "Agronomy labs, plant pathology, greenhouse research, agricultural chemistry."
  },
  "UNIPOLIS": {
    "display_name": "Baldev Raj Mittal Unipolis Arena",
    "short_label": "Unipolis Arena",
    "category": "auditorium_events",
    "block_number": "Unipolis",
    "building_id": "UNIPOLIS",
    "confidence": "verified",
    "source": "LPU Official Mega Venue Records",
    "notes": "Open-air mega-arena with tensile roof canopy, hosts youth festivals and international convocations."
  },
  "SPORTS_COMPLEX": {
    "display_name": "Shri Baldev Raj Mittal Indoor Sports Complex & Swimming Pool",
    "short_label": "Indoor Sports Complex",
    "category": "sports_complex",
    "block_number": "Sports",
    "building_id": "SPORTS_COMPLEX",
    "confidence": "verified",
    "source": "LPU Directorate of Sports & Youth Affairs",
    "notes": "Olympic-standard indoor swimming pool, multi-court indoor arena, badminton courts, fitness gym."
  }
};

Object.assign(overrides, institutionalBuildings);

fs.writeFileSync('src/data/locationNameOverrides.json', JSON.stringify(overrides, null, 2));
console.log('Updated src/data/locationNameOverrides.json to total', Object.keys(overrides).length, 'verified entries.');
