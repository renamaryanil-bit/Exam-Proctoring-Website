export const MOCK = {
  admin:   { name: "Dr. Admin",       role: "admin",   initials: "AD", email: "admin@proctoios.edu"  },
  teacher: { name: "Dr. Priya Singh", role: "teacher", initials: "PS", email: "priya@proctoios.edu"  },
  student: { name: "Aanya Kapoor",   role: "student", initials: "AK", email: "aanya@proctoios.edu"  },

  courses: [
    { id: 1, code: "CS301", name: "Data Structures & Algorithms", teacher: "Dr. Priya Singh", students: 142, exams: 4 },
    { id: 2, code: "MA202", name: "Linear Algebra",               teacher: "Dr. Rajiv Mehta",  students: 98,  exams: 3 },
    { id: 3, code: "PH401", name: "Quantum Mechanics",            teacher: "Dr. Ananya Bose",  students: 56,  exams: 2 },
    { id: 4, code: "EN101", name: "Technical Writing",            teacher: "Prof. Sanjay Kumar",students: 201, exams: 5 },
  ],

  exams: [
    { id: 1, title: "Midterm Examination",      course: "CS301", status: "live",     students: 138, violations: 18, duration: 90,  questions: 25, strictness: "moderate" },
    { id: 2, title: "Linear Algebra Quiz 4",    course: "MA202", status: "live",     students: 94,  violations: 3,  duration: 45,  questions: 15, strictness: "lenient"  },
    { id: 3, title: "Quantum Mechanics Final",  course: "PH401", status: "upcoming", students: 56,  violations: 0,  duration: 180, questions: 50, strictness: "strict"   },
    { id: 4, title: "Writing Skills Assessment",course: "EN101", status: "closed",   students: 198, violations: 12, duration: 60,  questions: 20, strictness: "lenient"  },
  ],

  students_proctor: [
    { id: 1, name: "Aanya Kapoor", seat: "14", status: "clear",    violations: 0, qProgress: "12/25" },
    { id: 2, name: "Rohan Mehta",  seat: "07", status: "warn",     violations: 2, qProgress: "8/25",  flag: "Tab switch" },
    { id: 3, name: "Arjun Sharma", seat: "22", status: "critical", violations: 3, qProgress: "15/25", flag: "Multi-face" },
    { id: 4, name: "Priya Nair",   seat: "03", status: "clear",    violations: 0, qProgress: "19/25" },
    { id: 5, name: "Dev Patel",    seat: "31", status: "warn",     violations: 1, qProgress: "6/25",  flag: "Audio anom." },
    { id: 6, name: "Meera Joshi",  seat: "18", status: "clear",    violations: 0, qProgress: "21/25" },
  ],

  questions: [
    {
      id: 1, type: "mcq",
      text: "Consider a binary search tree where keys are inserted in order: 50, 30, 70, 20, 40, 60, 80. What is the height of this tree?",
      options: ["2", "3", "4", "5"], correct: 1,
    },
    {
      id: 2, type: "mcq",
      text: "Which of the following data structures uses FIFO (First In, First Out) ordering?",
      options: ["Stack", "Queue", "Priority Queue", "Deque"], correct: 1,
    },
    {
      id: 3, type: "mcq",
      text: "What is the time complexity of searching in a balanced binary search tree with n elements?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correct: 1,
    },
    {
      id: 4, type: "numerical",
      text: "A hash table has 10 slots and uses the hash function h(k) = k mod 10. If keys 23, 33, 43 are inserted, how many collisions occur?",
      answer: "2",
    },
    {
      id: 5, type: "mcq",
      text: "Which sorting algorithm has the best average-case performance?",
      options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Quick Sort"], correct: 3,
    },
  ],

  analytics: {
    classAvg:      61.4,
    stdDev:        14.8,
    highest:       94,
    lowest:        22,
    studentScore:  74,
    studentRank:   12,
    totalStudents: 138,
    distribution:  [3, 6, 12, 24, 34, 28, 18, 8, 4, 1],
    qPerf:         [92, 78, 45, 28, 61, 18, 73, 55, 82, 39],
  },
};
