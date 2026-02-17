/**
 * Search Dictionary for Query Expansion
 * 
 * This dictionary contains technical abbreviations and their related terms
 * for intelligent search expansion. When a user searches for an abbreviation,
 * the system will also search for related full forms and synonyms.
 */

export interface SearchTerm {
	/** The primary term (usually the abbreviation) */
	term: string;
	/** Full form of the abbreviation */
	fullForm: string;
	/** Related terms and synonyms */
	related: string[];
	/** Category for grouping */
	category: string;
}

export const SEARCH_DICTIONARY: SearchTerm[] = [
	// ============== DATABASE ==============
	{
		term: "dbms",
		fullForm: "Database Management System",
		related: ["database", "sql", "rdbms", "data storage", "mysql", "postgresql", "mongodb"],
		category: "Database"
	},
	{
		term: "sql",
		fullForm: "Structured Query Language",
		related: ["database", "query", "mysql", "postgresql", "oracle", "dbms", "relational"],
		category: "Database"
	},
	{
		term: "nosql",
		fullForm: "Not Only SQL",
		related: ["mongodb", "database", "non-relational", "document database", "cassandra", "redis"],
		category: "Database"
	},
	{
		term: "rdbms",
		fullForm: "Relational Database Management System",
		related: ["database", "sql", "mysql", "postgresql", "oracle", "relational", "dbms"],
		category: "Database"
	},
	{
		term: "acid",
		fullForm: "Atomicity Consistency Isolation Durability",
		related: ["database", "transaction", "sql", "dbms", "data integrity"],
		category: "Database"
	},
	{
		term: "crud",
		fullForm: "Create Read Update Delete",
		related: ["database", "operations", "api", "rest", "data manipulation"],
		category: "Database"
	},
	{
		term: "orm",
		fullForm: "Object Relational Mapping",
		related: ["database", "prisma", "sequelize", "hibernate", "sql", "entity"],
		category: "Database"
	},

	// ============== AI/ML ==============
	{
		term: "nlp",
		fullForm: "Natural Language Processing",
		related: ["ai", "machine learning", "text processing", "chatbot", "language model", "transformer"],
		category: "AI/ML"
	},
	{
		term: "ml",
		fullForm: "Machine Learning",
		related: ["ai", "artificial intelligence", "deep learning", "model", "training", "neural network"],
		category: "AI/ML"
	},
	{
		term: "ai",
		fullForm: "Artificial Intelligence",
		related: ["machine learning", "deep learning", "neural network", "automation", "intelligent systems"],
		category: "AI/ML"
	},
	{
		term: "dl",
		fullForm: "Deep Learning",
		related: ["neural network", "machine learning", "ai", "cnn", "rnn", "transformer"],
		category: "AI/ML"
	},
	{
		term: "cnn",
		fullForm: "Convolutional Neural Network",
		related: ["deep learning", "image processing", "computer vision", "neural network", "convolution"],
		category: "AI/ML"
	},
	{
		term: "rnn",
		fullForm: "Recurrent Neural Network",
		related: ["deep learning", "sequence", "lstm", "gru", "time series", "neural network"],
		category: "AI/ML"
	},
	{
		term: "lstm",
		fullForm: "Long Short-Term Memory",
		related: ["rnn", "deep learning", "sequence", "neural network", "memory cell"],
		category: "AI/ML"
	},
	{
		term: "gpt",
		fullForm: "Generative Pre-trained Transformer",
		related: ["ai", "language model", "transformer", "openai", "chatgpt", "llm"],
		category: "AI/ML"
	},
	{
		term: "llm",
		fullForm: "Large Language Model",
		related: ["ai", "gpt", "transformer", "language model", "chatbot", "nlp"],
		category: "AI/ML"
	},
	{
		term: "gan",
		fullForm: "Generative Adversarial Network",
		related: ["deep learning", "image generation", "neural network", "discriminator", "generator"],
		category: "AI/ML"
	},
	{
		term: "cv",
		fullForm: "Computer Vision",
		related: ["image processing", "cnn", "object detection", "recognition", "deep learning"],
		category: "AI/ML"
	},

	// ============== WEB DEVELOPMENT ==============
	{
		term: "html",
		fullForm: "HyperText Markup Language",
		related: ["web", "frontend", "markup", "dom", "webpage", "browser"],
		category: "Web"
	},
	{
		term: "css",
		fullForm: "Cascading Style Sheets",
		related: ["web", "styling", "frontend", "design", "responsive", "tailwind", "sass"],
		category: "Web"
	},
	{
		term: "js",
		fullForm: "JavaScript",
		related: ["web", "frontend", "programming", "nodejs", "react", "typescript", "ecmascript"],
		category: "Web"
	},
	{
		term: "ts",
		fullForm: "TypeScript",
		related: ["javascript", "typed", "frontend", "programming", "static typing"],
		category: "Web"
	},
	{
		term: "dom",
		fullForm: "Document Object Model",
		related: ["html", "javascript", "browser", "web", "manipulation", "elements"],
		category: "Web"
	},
	{
		term: "api",
		fullForm: "Application Programming Interface",
		related: ["rest", "endpoint", "backend", "integration", "web service", "graphql"],
		category: "Web"
	},
	{
		term: "rest",
		fullForm: "Representational State Transfer",
		related: ["api", "http", "web service", "crud", "endpoint", "json"],
		category: "Web"
	},
	{
		term: "json",
		fullForm: "JavaScript Object Notation",
		related: ["data format", "api", "web", "serialization", "javascript"],
		category: "Web"
	},
	{
		term: "xml",
		fullForm: "Extensible Markup Language",
		related: ["data format", "markup", "web", "soap", "configuration"],
		category: "Web"
	},
	{
		term: "spa",
		fullForm: "Single Page Application",
		related: ["react", "angular", "vue", "frontend", "web app", "routing"],
		category: "Web"
	},
	{
		term: "ssr",
		fullForm: "Server Side Rendering",
		related: ["nextjs", "web", "seo", "performance", "react", "rendering"],
		category: "Web"
	},
	{
		term: "csr",
		fullForm: "Client Side Rendering",
		related: ["spa", "react", "frontend", "browser", "rendering"],
		category: "Web"
	},
	{
		term: "seo",
		fullForm: "Search Engine Optimization",
		related: ["web", "google", "ranking", "marketing", "meta tags", "ssr"],
		category: "Web"
	},
	{
		term: "pwa",
		fullForm: "Progressive Web Application",
		related: ["web app", "mobile", "service worker", "offline", "installable"],
		category: "Web"
	},
	{
		term: "ui",
		fullForm: "User Interface",
		related: ["design", "frontend", "ux", "component", "layout", "visual"],
		category: "Web"
	},
	{
		term: "ux",
		fullForm: "User Experience",
		related: ["design", "usability", "ui", "interaction", "accessibility"],
		category: "Web"
	},

	// ============== PROGRAMMING ==============
	{
		term: "oop",
		fullForm: "Object Oriented Programming",
		related: ["class", "inheritance", "polymorphism", "encapsulation", "abstraction", "java"],
		category: "Programming"
	},
	{
		term: "ide",
		fullForm: "Integrated Development Environment",
		related: ["vscode", "editor", "intellij", "coding", "development", "debugging"],
		category: "Programming"
	},
	{
		term: "sdk",
		fullForm: "Software Development Kit",
		related: ["library", "framework", "development", "tools", "api"],
		category: "Programming"
	},
	{
		term: "cli",
		fullForm: "Command Line Interface",
		related: ["terminal", "console", "shell", "command prompt", "bash"],
		category: "Programming"
	},
	{
		term: "gui",
		fullForm: "Graphical User Interface",
		related: ["visual", "desktop", "windows", "interface", "ui"],
		category: "Programming"
	},
	{
		term: "regex",
		fullForm: "Regular Expression",
		related: ["pattern matching", "string", "validation", "search", "text processing"],
		category: "Programming"
	},
	{
		term: "dsa",
		fullForm: "Data Structures and Algorithms",
		related: ["array", "linked list", "tree", "graph", "sorting", "searching", "coding interview"],
		category: "Programming"
	},
	{
		term: "mvc",
		fullForm: "Model View Controller",
		related: ["architecture", "design pattern", "web", "framework", "separation of concerns"],
		category: "Programming"
	},

	// ============== NETWORKING ==============
	{
		term: "http",
		fullForm: "HyperText Transfer Protocol",
		related: ["web", "internet", "request", "response", "https", "protocol"],
		category: "Networking"
	},
	{
		term: "https",
		fullForm: "HyperText Transfer Protocol Secure",
		related: ["ssl", "tls", "security", "encryption", "web", "certificate"],
		category: "Networking"
	},
	{
		term: "tcp",
		fullForm: "Transmission Control Protocol",
		related: ["networking", "connection", "reliable", "ip", "socket"],
		category: "Networking"
	},
	{
		term: "udp",
		fullForm: "User Datagram Protocol",
		related: ["networking", "connectionless", "fast", "streaming", "ip"],
		category: "Networking"
	},
	{
		term: "ip",
		fullForm: "Internet Protocol",
		related: ["networking", "address", "tcp", "router", "packet"],
		category: "Networking"
	},
	{
		term: "dns",
		fullForm: "Domain Name System",
		related: ["domain", "internet", "address", "nameserver", "resolution"],
		category: "Networking"
	},
	{
		term: "cdn",
		fullForm: "Content Delivery Network",
		related: ["caching", "performance", "edge", "cloudflare", "distribution"],
		category: "Networking"
	},
	{
		term: "vpn",
		fullForm: "Virtual Private Network",
		related: ["security", "privacy", "tunnel", "encryption", "remote"],
		category: "Networking"
	},

	// ============== CLOUD & DEVOPS ==============
	{
		term: "aws",
		fullForm: "Amazon Web Services",
		related: ["cloud", "amazon", "ec2", "s3", "lambda", "serverless"],
		category: "Cloud"
	},
	{
		term: "gcp",
		fullForm: "Google Cloud Platform",
		related: ["cloud", "google", "compute", "kubernetes", "firebase"],
		category: "Cloud"
	},
	{
		term: "ci",
		fullForm: "Continuous Integration",
		related: ["devops", "automation", "testing", "build", "pipeline", "jenkins"],
		category: "DevOps"
	},
	{
		term: "cd",
		fullForm: "Continuous Deployment",
		related: ["devops", "automation", "release", "pipeline", "deployment"],
		category: "DevOps"
	},
	{
		term: "k8s",
		fullForm: "Kubernetes",
		related: ["container", "orchestration", "docker", "cluster", "pods", "devops"],
		category: "Cloud"
	},
	{
		term: "vm",
		fullForm: "Virtual Machine",
		related: ["virtualization", "cloud", "server", "vmware", "hypervisor"],
		category: "Cloud"
	},
	{
		term: "iaas",
		fullForm: "Infrastructure as a Service",
		related: ["cloud", "aws", "azure", "gcp", "virtual machine", "infrastructure"],
		category: "Cloud"
	},
	{
		term: "paas",
		fullForm: "Platform as a Service",
		related: ["cloud", "heroku", "platform", "deployment", "managed"],
		category: "Cloud"
	},
	{
		term: "saas",
		fullForm: "Software as a Service",
		related: ["cloud", "subscription", "web app", "service", "hosted"],
		category: "Cloud"
	},

	// ============== SECURITY ==============
	{
		term: "ssl",
		fullForm: "Secure Sockets Layer",
		related: ["security", "encryption", "https", "certificate", "tls"],
		category: "Security"
	},
	{
		term: "tls",
		fullForm: "Transport Layer Security",
		related: ["security", "encryption", "ssl", "https", "certificate"],
		category: "Security"
	},
	{
		term: "jwt",
		fullForm: "JSON Web Token",
		related: ["authentication", "token", "security", "api", "authorization"],
		category: "Security"
	},
	{
		term: "oauth",
		fullForm: "Open Authorization",
		related: ["authentication", "authorization", "login", "google", "social login"],
		category: "Security"
	},
	{
		term: "xss",
		fullForm: "Cross Site Scripting",
		related: ["security", "vulnerability", "injection", "web", "attack"],
		category: "Security"
	},
	{
		term: "csrf",
		fullForm: "Cross Site Request Forgery",
		related: ["security", "vulnerability", "attack", "web", "token"],
		category: "Security"
	},
	{
		term: "ddos",
		fullForm: "Distributed Denial of Service",
		related: ["attack", "security", "traffic", "flooding", "protection"],
		category: "Security"
	},

	// ============== DATA SCIENCE ==============
	{
		term: "etl",
		fullForm: "Extract Transform Load",
		related: ["data pipeline", "data engineering", "warehouse", "processing"],
		category: "Data Science"
	},
	{
		term: "eda",
		fullForm: "Exploratory Data Analysis",
		related: ["data science", "visualization", "statistics", "pandas", "analysis"],
		category: "Data Science"
	},
	{
		term: "knn",
		fullForm: "K-Nearest Neighbors",
		related: ["machine learning", "classification", "clustering", "algorithm"],
		category: "Data Science"
	},
	{
		term: "svm",
		fullForm: "Support Vector Machine",
		related: ["machine learning", "classification", "kernel", "algorithm"],
		category: "Data Science"
	},
	{
		term: "pca",
		fullForm: "Principal Component Analysis",
		related: ["dimensionality reduction", "machine learning", "feature extraction"],
		category: "Data Science"
	},

	// ============== SOFTWARE ENGINEERING ==============
	{
		term: "sdlc",
		fullForm: "Software Development Life Cycle",
		related: ["development", "process", "agile", "waterfall", "methodology"],
		category: "Engineering"
	},
	{
		term: "agile",
		fullForm: "Agile Methodology",
		related: ["scrum", "sprint", "development", "iterative", "kanban"],
		category: "Engineering"
	},
	{
		term: "scrum",
		fullForm: "Scrum Framework",
		related: ["agile", "sprint", "standup", "backlog", "methodology"],
		category: "Engineering"
	},
	{
		term: "tdd",
		fullForm: "Test Driven Development",
		related: ["testing", "development", "unit test", "methodology", "red green refactor"],
		category: "Engineering"
	},
	{
		term: "bdd",
		fullForm: "Behavior Driven Development",
		related: ["testing", "cucumber", "specification", "gherkin", "methodology"],
		category: "Engineering"
	},
	{
		term: "solid",
		fullForm: "Single responsibility Open-closed Liskov Interface Dependency",
		related: ["design principles", "oop", "clean code", "architecture"],
		category: "Engineering"
	},
	{
		term: "dry",
		fullForm: "Don't Repeat Yourself",
		related: ["principle", "clean code", "reusability", "refactoring"],
		category: "Engineering"
	},
	{
		term: "kiss",
		fullForm: "Keep It Simple Stupid",
		related: ["principle", "simplicity", "clean code", "design"],
		category: "Engineering"
	},
	{
		term: "uml",
		fullForm: "Unified Modeling Language",
		related: ["diagram", "design", "class diagram", "sequence diagram", "modeling"],
		category: "Engineering"
	},
	{
		term: "pr",
		fullForm: "Pull Request",
		related: ["git", "github", "code review", "merge", "version control"],
		category: "Engineering"
	},
	{
		term: "vcs",
		fullForm: "Version Control System",
		related: ["git", "svn", "repository", "commit", "branch"],
		category: "Engineering"
	},

	// ============== SYSTEMS ==============
	{
		term: "os",
		fullForm: "Operating System",
		related: ["windows", "linux", "macos", "kernel", "system software"],
		category: "Systems"
	},
	{
		term: "cpu",
		fullForm: "Central Processing Unit",
		related: ["processor", "hardware", "computing", "intel", "amd", "core"],
		category: "Systems"
	},
	{
		term: "gpu",
		fullForm: "Graphics Processing Unit",
		related: ["graphics", "nvidia", "cuda", "rendering", "deep learning", "parallel"],
		category: "Systems"
	},
	{
		term: "ram",
		fullForm: "Random Access Memory",
		related: ["memory", "hardware", "storage", "volatile", "ddr"],
		category: "Systems"
	},
	{
		term: "ssd",
		fullForm: "Solid State Drive",
		related: ["storage", "hardware", "fast", "nvme", "disk"],
		category: "Systems"
	},
	{
		term: "hdd",
		fullForm: "Hard Disk Drive",
		related: ["storage", "hardware", "disk", "mechanical", "data"],
		category: "Systems"
	},

	// ============== ALGORITHMS ==============
	{
		term: "bfs",
		fullForm: "Breadth First Search",
		related: ["algorithm", "graph", "traversal", "queue", "shortest path"],
		category: "Algorithms"
	},
	{
		term: "dfs",
		fullForm: "Depth First Search",
		related: ["algorithm", "graph", "traversal", "stack", "recursion"],
		category: "Algorithms"
	},
	{
		term: "dp",
		fullForm: "Dynamic Programming",
		related: ["algorithm", "optimization", "memoization", "recursion", "tabulation"],
		category: "Algorithms"
	},

	// ============== FORMATS ==============
	{
		term: "pdf",
		fullForm: "Portable Document Format",
		related: ["document", "file", "adobe", "reader", "format"],
		category: "Format"
	},
	{
		term: "csv",
		fullForm: "Comma Separated Values",
		related: ["data", "spreadsheet", "excel", "table", "format"],
		category: "Format"
	},
	{
		term: "yaml",
		fullForm: "YAML Ain't Markup Language",
		related: ["configuration", "data format", "docker", "kubernetes"],
		category: "Format"
	},
	{
		term: "svg",
		fullForm: "Scalable Vector Graphics",
		related: ["image", "vector", "graphics", "web", "icon"],
		category: "Format"
	},

	// ============== ACADEMIC ==============
	{
		term: "phd",
		fullForm: "Doctor of Philosophy",
		related: ["doctorate", "research", "thesis", "academic", "degree"],
		category: "Academic"
	},
	{
		term: "msc",
		fullForm: "Master of Science",
		related: ["masters", "postgraduate", "degree", "academic"],
		category: "Academic"
	},
	{
		term: "bsc",
		fullForm: "Bachelor of Science",
		related: ["bachelors", "undergraduate", "degree", "academic"],
		category: "Academic"
	},
	{
		term: "gpa",
		fullForm: "Grade Point Average",
		related: ["grades", "academic", "cgpa", "score", "performance"],
		category: "Academic"
	},
	{
		term: "cgpa",
		fullForm: "Cumulative Grade Point Average",
		related: ["grades", "academic", "gpa", "score", "overall"],
		category: "Academic"
	},
];

// Build lookup maps for fast access
const termToEntry = new Map<string, SearchTerm>();
const allTermsLower = new Set<string>();

SEARCH_DICTIONARY.forEach(entry => {
	const termLower = entry.term.toLowerCase();
	termToEntry.set(termLower, entry);
	allTermsLower.add(termLower);

	// Also index by full form words for reverse lookup
	const fullFormWords = entry.fullForm.toLowerCase().split(/\s+/);
	fullFormWords.forEach(word => {
		if (word.length > 3) {
			allTermsLower.add(word);
		}
	});
});

/**
 * Get search entry by term
 */
export function getSearchEntry(term: string): SearchTerm | undefined {
	return termToEntry.get(term.toLowerCase());
}

/**
 * Check if a term exists in the dictionary
 */
export function hasTerm(term: string): boolean {
	return termToEntry.has(term.toLowerCase());
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
	const categories = new Set<string>();
	SEARCH_DICTIONARY.forEach(entry => categories.add(entry.category));
	return Array.from(categories).sort();
}

/**
 * Get terms by category
 */
export function getTermsByCategory(category: string): SearchTerm[] {
	return SEARCH_DICTIONARY.filter(entry => entry.category === category);
}
