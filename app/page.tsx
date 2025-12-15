"use client";

import React from "react";

import { useState } from "react";
import {
	Upload,
	FileText,
	CheckCircle,
	XCircle,
	Loader2,
	Download,
	Eye,
	EyeOff,
} from "lucide-react";

interface IStage {
	name: string;
	status: string;
	description: string;
}

export default function Home() {
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [extractedLabels, setExtractedLabels] = useState<any>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingStages, setProcessingStages] = useState<IStage[]>([]);
	const [rawOCRText, setRawOCRText] = useState<string>("");
	const [showPreprocessed, setShowPreprocessed] = useState(false);
	const [preprocessedImage, setPreprocessedImage] = useState<string | null>(
		null
	);
	const [confidenceScores, setConfidenceScores] = useState<
		Map<string, number>
	>(new Map());
	const [formTypeInfo, setFormTypeInfo] = useState<any>(null);

	interface FormTypeConfig {
		name: string;
		keywords: string[];
		fieldPatterns: RegExp[];
		sections: string[];
		confidence_boost: number;
	}

	const FORM_TYPE_CONFIGS: Record<string, FormTypeConfig> = {
		hospital: {
			name: "Hospital Form",
			keywords: [
				"patient",
				"doctor",
				"medical",
				"hospital",
				"diagnosis",
				"treatment",
				"prescription",
				"blood",
				"ward",
				"bed",
				"discharge",
				"admission",
				"clinical",
				"symptoms",
				"disease",
				"medicine",
				"dosage",
				"allergies",
			],
			fieldPatterns: [
				/patient\s*(?:name|id|number)/i,
				/date\s*of\s*(?:admission|birth|discharge)/i,
				/doctor\s*(?:name|signature)/i,
				/diagnosis|treatment|prescription/i,
				/blood\s*(?:group|type)/i,
				/allergies|medications/i,
			],
			sections: [
				"Patient Information",
				"Medical History",
				"Diagnosis",
				"Treatment",
				"Discharge",
			],
			confidence_boost: 20,
		},
		hostel: {
			name: "Hostel Form",
			keywords: [
				"hostel",
				"room",
				"warden",
				"student",
				"accommodation",
				"diet",
				"vegetarian",
				"non-vegetarian",
				"check-in",
				"check-out",
				"stay",
				"semester",
				"branch",
				"admission",
				"hostel fee",
				"mess",
			],
			fieldPatterns: [
				/hostel\s*(?:name|number|room)/i,
				/room\s*(?:number|type|allocation)/i,
				/warden|mess|diet/i,
				/check\s*(?:in|out)|stay\s*period/i,
				/vegetarian|non-vegetarian/i,
			],
			sections: [
				"Student Information",
				"Room Allocation",
				"Hostel Details",
				"Mess Information",
				"Duration of Stay",
			],
			confidence_boost: 18,
		},
		college: {
			name: "College Form",
			keywords: [
				"student",
				"college",
				"university",
				"course",
				"semester",
				"branch",
				"department",
				"enrollment",
				"registration",
				"admission",
				"roll number",
				"cgpa",
				"marks",
				"grade",
				"academic",
			],
			fieldPatterns: [
				/(?:student|enrollment|roll)\s*(?:name|number|id)/i,
				/course|branch|department|semester/i,
				/academic\s*(?:year|session)/i,
				/marks|grade|cgpa|result/i,
				/admission\s*(?:date|number)/i,
			],
			sections: [
				"Student Information",
				"Academic Details",
				"Course Information",
				"Performance",
				"Verification",
			],
			confidence_boost: 18,
		},
		government: {
			name: "Government Form",
			keywords: [
				"government",
				"official",
				"department",
				"ministry",
				"authority",
				"license",
				"permit",
				"certificate",
				"registration",
				"application",
				"approval",
				"signature",
				"seal",
				"stamp",
				"authorized",
			],
			fieldPatterns: [
				/(?:application|form)\s*(?:number|id)/i,
				/date\s*of\s*(?:application|submission|approval)/i,
				/authorized\s*(?:by|signature)|official\s*seal/i,
				/department|ministry|authority/i,
				/approval|rejection|status/i,
			],
			sections: [
				"Applicant Information",
				"Application Details",
				"Supporting Documents",
				"Authorization",
				"Remarks",
			],
			confidence_boost: 20,
		},
		medical: {
			name: "Medical/Prescription Form",
			keywords: [
				"prescription",
				"medicine",
				"dosage",
				"frequency",
				"duration",
				"patient",
				"doctor",
				"clinic",
				"pharmacy",
				"tablet",
				"capsule",
				"injection",
				"ointment",
				"syrup",
			],
			fieldPatterns: [
				/medicine|drug|tablet|capsule|injection/i,
				/dosage|frequency|duration/i,
				/before|after|meals|food/i,
				/side\s*effects|contraindications/i,
				/doctor\s*(?:name|signature|stamp)/i,
			],
			sections: [
				"Patient Information",
				"Medications",
				"Dosage Instructions",
				"Precautions",
				"Doctor Information",
			],
			confidence_boost: 19,
		},
		application: {
			name: "Application Form",
			keywords: [
				"application",
				"applicant",
				"position",
				"job",
				"vacancy",
				"experience",
				"qualification",
				"date",
				"signature",
				"declaration",
				"terms",
				"conditions",
			],
			fieldPatterns: [
				/applicant\s*(?:name|address|contact)/i,
				/position|job|vacancy|designation/i,
				/experience|qualification|education/i,
				/date\s*of\s*(?:birth|application)/i,
				/declaration|signature|date/i,
			],
			sections: [
				"Personal Information",
				"Qualifications",
				"Experience",
				"Declaration",
				"Signature",
			],
			confidence_boost: 17,
		},
	};

	const detectFormType = (
		text: string
	): { type: string; config: FormTypeConfig; confidence: number } => {
		let bestMatch = {
			type: "generic",
			config: FORM_TYPE_CONFIGS.college,
			confidence: 0,
		};

		for (const [formType, config] of Object.entries(FORM_TYPE_CONFIGS)) {
			const lowerText = text.toLowerCase();
			let matchCount = 0;
			let patternMatches = 0;

			// Count keyword matches
			for (const keyword of config.keywords) {
				const regex = new RegExp(`\\b${keyword}\\b`, "gi");
				const matches = lowerText.match(regex);
				if (matches) matchCount += matches.length;
			}

			// Count pattern matches
			for (const pattern of config.fieldPatterns) {
				if (pattern.test(text)) patternMatches++;
			}

			const confidence =
				(matchCount * 5 + patternMatches * 15) /
				(config.keywords.length + config.fieldPatterns.length);

			if (confidence > bestMatch.confidence) {
				bestMatch = {
					type: formType,
					config,
					confidence: Math.min(100, confidence),
				};
			}
		}

		return bestMatch;
	};

	const analyzeFormLayout = (
		text: string
	): { sections: string[]; fieldGroups: Map<string, string[]> } => {
		const lines = text.split("\n").map((line) => line.trim());
		const sections: string[] = [];
		const fieldGroups = new Map<string, string[]>();
		let currentSection = "General";
		const sectionKeywords =
			/^(section|part|chapter|information|details|declaration|signature|verification|authorization|remarks|notes|comments|additional|special|preferences|choices|options|categories|quotas|merits|ranks|scores|percentages|divisions|results|attendance|conduct|behavior|discipline|uniforms|documents|certificates|diplomas|degrees|licenses|permits|visas|passports|ids|proofs|accounts|statements|ledgers|vouchers|receipts|invoices|bills|estimates|quotations|orders|deliveries|trackings|shipments|cargos|freights|customs|duties|taxes|discounts|rebates|refunds|claims|complaints|feedbacks|reviews|ratings|comments|suggestions|recommendations|approvals|rejections|pending|cancelled|completed|submitted|received|processed|verified|approved|rejected|on hold|in progress|completed|cancelled|archived|deleted|restored|updated|modified|created|edited|reviewed|approved|signed|sealed|stamped|notarized|witnessed|attested|certified|authorized|endorsed|countersigned|initialed|dated|timed|logged|recorded|documented|filed|stored|archived|backed up|restored|recovered|migrated|transferred|exported|imported|synchronized|replicated|distributed|shared|published|posted|uploaded|downloaded|streamed|cached|buffered|compressed|encrypted|decrypted|hashed|signed|verified|validated|authenticated|authorized|permitted|allowed|denied|blocked|restricted|limited|unlimited|conditional|provisional|temporary|permanent|fixed|variable)[\s:]*$/i;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (sectionKeywords.test(line)) {
				currentSection = line.replace(/[:*\-_]+\s*$/, "").trim();
				sections.push(currentSection);
				fieldGroups.set(currentSection, []);
			} else if (line.length > 2 && line.length < 150) {
				if (!fieldGroups.has(currentSection)) {
					fieldGroups.set(currentSection, []);
				}
				fieldGroups.get(currentSection)!.push(line);
			}
		}

		return { sections, fieldGroups };
	};

	const extractTypeSpecificLabels = (
		text: string,
		formType: string,
		config: FormTypeConfig
	): { labels: string[]; metadata: any } => {
		const lines = text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
		const labels: string[] = [];
		const seenLabels = new Set<string>();
		const metadata = {
			formType,
			detectedSections: [] as string[],
			fieldGroups: {} as Record<string, string[]>,
		};

		// Analyze layout
		const { sections, fieldGroups } = analyzeFormLayout(text);
		metadata.detectedSections = sections;
		metadata.fieldGroups = Object.fromEntries(fieldGroups);

		// Extract labels with type-specific patterns
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			if (line.length < 2 || line.length > 200) continue;

			// Apply OCR error corrections - Enhanced for form characters
			line = line
				// Fix common character confusions
				.replace(/[|]/g, "I")
				.replace(/[0O]/g, (match, offset) => {
					const nextChar = line[offset + 1];
					const prevChar = line[offset - 1];
					// Better context for O vs 0
					if (/[a-zA-Z]/.test(nextChar) || /[a-zA-Z]/.test(prevChar)) return "O";
					if (/[0-9]/.test(nextChar) || /[0-9]/.test(prevChar)) return "0";
					return match;
				})
				.replace(/[1l]/g, (match, offset) => {
					const prevChar = line[offset - 1];
					const nextChar = line[offset + 1];
					if (/[a-zA-Z]/.test(prevChar) || /[a-zA-Z]/.test(nextChar)) return "l";
					if (/[0-9]/.test(prevChar) || /[0-9]/.test(nextChar)) return "1";
					return match;
				})
				// Fix bracket and parenthesis recognition
				.replace(/\(/g, "(")
				.replace(/\)/g, ")")
				.replace(/\[/g, "[")
				.replace(/\]/g, "]")
				.replace(/\{/g, "{")
				.replace(/\}/g, "}")
				// Fix colon recognition (common OCR error)
				.replace(/[.;,]/g, (match) => {
					// Check if this should be a colon based on context
					const beforeMatch = line.substring(0, line.indexOf(match));
					const afterMatch = line.substring(line.indexOf(match) + 1);
					
					// If it's at the end of a label word, likely should be colon
					if (beforeMatch.trim().split(/\s+/).pop()?.length > 0 && 
						afterMatch.trim().length === 0) {
						return ":";
					}
					return match;
				})
				// Fix common form field pattern misrecognitions
				.replace(/\[\s*\]/g, "[ ]")
				.replace(/\(\s*\)/g, "( )")
				.replace(/\s+:\s+/g, ": ")
				.replace(/\s*:\s*$/, ":")
				// Fix dot patterns in forms
				.replace(/\.{3,}/g, "...")
				.replace(/\s+\.\s+/g, ". ")
				.replace(/\s+\.$/, ".");

			if (/^\d+[\d/\-:.]*$/.test(line)) continue;

			const specialCharCount = (
				line.match(/[^a-zA-Z0-9\s\-:().,/&*]/g) || []
			).length;
			if (specialCharCount > line.length * 0.6) continue;

			const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
			if (alphaCount < 2) continue;

			// Check against type-specific patterns
			const matchesTypePattern = config.fieldPatterns.some((pattern) =>
				pattern.test(line)
			);
			const matchesTypeKeyword = config.keywords.some((keyword) =>
				new RegExp(`\\b${keyword}\\b`, "i").test(line)
			);

			const labelPatterns = [
				/^[A-Z][a-zA-Z\s]{2,}[:*\-_]/,
				/[:*]\s*$/,
				/^\d+[.)]\s*[A-Z]/,
				/^[A-Z][a-zA-Z\s]{1,}\s+\$[A-Za-z\s/]+$/,
				/^[A-Z][a-zA-Z\s]*\s+\$.*$/,
			];

			const isLabel =
				labelPatterns.some((pattern) => pattern.test(line)) ||
				((matchesTypePattern || matchesTypeKeyword) &&
					line.length < 100);

			if (isLabel) {
				const normalized = line
					.replace(/[:*\-_]+\s*$/, "")
					.replace(/^\d+[.)]\s*/, "")
					.trim();

				const lowerNorm = normalized.toLowerCase();
				if (!seenLabels.has(lowerNorm) && normalized.length >= 2) {
					labels.push(normalized);
					seenLabels.add(lowerNorm);
				}
			}
		}

		return { labels, metadata };
	};

	const adaptiveThreshold = (
		data: Uint8ClampedArray,
		width: number,
		height: number
	): number => {
		const histogram = new Array(256).fill(0);

		for (let i = 0; i < data.length; i += 4) {
			const gray = Math.round(
				data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
			);
			histogram[gray]++;
		}

		let sum = 0;
		let sumB = 0;
		let wB = 0;
		let wF = 0;
		let maxVar = 0;
		let threshold = 0;
		const total = width * height;

		for (let i = 0; i < 256; i++) {
			sum += i * histogram[i];
		}

		for (let t = 0; t < 256; t++) {
			wB += histogram[t];
			if (wB === 0) continue;

			wF = total - wB;
			if (wF === 0) break;

			sumB += t * histogram[t];
			const mB = sumB / wB;
			const mF = (sum - sumB) / wF;
			const variance = wB * wF * (mB - mF) * (mB - mF);

			if (variance > maxVar) {
				maxVar = variance;
				threshold = t;
			}
		}

		return threshold;
	};

	const enhanceContrast = (data: Uint8ClampedArray): void => {
		let min = 255;
		let max = 0;

		for (let i = 0; i < data.length; i += 4) {
			const gray = data[i];
			min = Math.min(min, gray);
			max = Math.max(max, gray);
		}

		const range = max - min || 1;
		// Apply more gentle contrast enhancement to preserve form structures
		const contrastFactor = 1.5; // Reduced from full enhancement
		
		for (let i = 0; i < data.length; i += 4) {
			const normalized = (data[i] - min) / range;
			// Apply sigmoid-like contrast enhancement for better form preservation
			const enhanced = 255 / (1 + Math.exp(-10 * (normalized - 0.5) * contrastFactor));
			data[i] = enhanced;
			data[i + 1] = enhanced;
			data[i + 2] = enhanced;
		}
	};

	const detectSkew = (
		data: Uint8ClampedArray,
		width: number,
		height: number
	): number => {
		let maxSkew = 0;
		let maxScore = 0;

		for (let angle = -15; angle <= 15; angle += 1) {
			let score = 0;
			const rad = (angle * Math.PI) / 180;

			for (let y = 0; y < height; y += 10) {
				for (let x = 0; x < width; x += 10) {
					const idx = (y * width + x) * 4;
					if (data[idx] < 128) {
						const newX = x * Math.cos(rad) - y * Math.sin(rad);
						if (newX > 0 && newX < width) score++;
					}
				}
			}

			if (score > maxScore) {
				maxScore = score;
				maxSkew = angle;
			}
		}

		return maxSkew;
	};

	const despeckle = (
		data: Uint8ClampedArray,
		width: number,
		height: number
	): void => {
		const temp = new Uint8ClampedArray(data);

		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				let blackCount = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = ((y + ky) * width + (x + kx)) * 4;
						if (temp[idx] < 128) blackCount++;
					}
				}

				const idx = (y * width + x) * 4;
				if (blackCount < 3) {
					data[idx] = data[idx + 1] = data[idx + 2] = 255;
				}
			}
		}
	};

	// Post-processing function for final character correction and form pattern enhancement
	const postProcessOCRResults = (labels: string[]): string[] => {
		return labels.map(label => {
			let processedLabel = label;
			
			// Fix common form-specific OCR errors
			processedLabel = processedLabel
				// Fix colons that were misrecognized as other punctuation
				.replace(/([a-zA-Z0-9])\s*[.;,]\s*$/g, '$1:')
				// Fix brackets that were misrecognized
				.replace(/\[\s*\]/g, '[ ]')
				.replace(/\(\s*\)/g, '( )')
				// Fix multiple spaces
				.replace(/\s{2,}/g, ' ')
				// Fix common character confusions in form context
				.replace(/(\w)0/g, '$1O') // O after letter
				.replace(/0(\w)/g, 'O$1') // O before letter
				.replace(/(\w)1/g, '$1l') // l after letter
				.replace(/1(\w)/g, 'l$1') // l before letter
				// Fix form field indicators
				.replace(/\.{2,}/g, '...')
				.replace(/[:\s]*\.{3,}/g, ':...')
				// Clean up trailing/leading spaces
				.trim();
			
			// Validate that the label still looks like a form field
			if (processedLabel.length < 2 || processedLabel.length > 200) {
				return label; // Revert if processing made it invalid
			}
			
			return processedLabel;
		});
	};

	const preprocessImage = (imageData: string): Promise<string> => {
		return new Promise((resolve, reject) => {
			if (!imageData) {
				reject(new Error("No image data provided"));
				return;
			}

			const img = new Image();
			img.crossOrigin = "anonymous";

			const timeout = setTimeout(() => {
				reject(new Error("Image loading timeout"));
			}, 10000);

			img.onerror = () => {
				clearTimeout(timeout);
				reject(new Error("Failed to load image"));
			};

			img.onload = () => {
				clearTimeout(timeout);
				try {
					if (!img.width || !img.height) {
						throw new Error("Invalid image dimensions");
					}

					const canvas = document.createElement("canvas");
					const scaleFactor = Math.min(
						3000 / img.width,  // Increased resolution for better OCR
						3000 / img.height,
						3  // Increased scale factor for forms
					);
					canvas.width = img.width * scaleFactor;
					canvas.height = img.height * scaleFactor;

					const ctx = canvas.getContext("2d");
					if (!ctx) {
						throw new Error("Failed to get canvas context");
					}

					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					const imageData = ctx.getImageData(
						0,
						0,
						canvas.width,
						canvas.height
					);
					if (!imageData || !imageData.data) {
						throw new Error("Failed to get image data");
					}

					const data = imageData.data;

					// Convert to grayscale
					for (let i = 0; i < data.length; i += 4) {
						const gray =
							data[i] * 0.299 +
							data[i + 1] * 0.587 +
							data[i + 2] * 0.114;
						data[i] = gray;
						data[i + 1] = gray;
						data[i + 2] = gray;
					}

					enhanceContrast(data);

					// Apply Gaussian blur for noise reduction
					const blurred = new Uint8ClampedArray(data);
					const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
					const kernelSum = 16;

					for (let y = 1; y < canvas.height - 1; y++) {
						for (let x = 1; x < canvas.width - 1; x++) {
							let sum = 0;
							for (let ky = -1; ky <= 1; ky++) {
								for (let kx = -1; kx <= 1; kx++) {
									const idx =
										((y + ky) * canvas.width + (x + kx)) *
										4;
									sum +=
										data[idx] *
										kernel[(ky + 1) * 3 + (kx + 1)];
								}
							}
							const idx = (y * canvas.width + x) * 4;
							blurred[idx] =
								blurred[idx + 1] =
								blurred[idx + 2] =
									sum / kernelSum;
						}
					}

					data.set(blurred);

					// Adaptive thresholding using Otsu's method
					const threshold = adaptiveThreshold(
						data,
						canvas.width,
						canvas.height
					);

					for (let i = 0; i < data.length; i += 4) {
						const bw = data[i] > threshold ? 255 : 0;
						data[i] = bw;
						data[i + 1] = bw;
						data[i + 2] = bw;
					}

					despeckle(data, canvas.width, canvas.height);

					// Morphological operations - erosion then dilation (opening)
					const temp = new Uint8ClampedArray(data);

					// Erosion
					for (let y = 1; y < canvas.height - 1; y++) {
						for (let x = 1; x < canvas.width - 1; x++) {
							let minVal = 255;
							for (let ky = -1; ky <= 1; ky++) {
								for (let kx = -1; kx <= 1; kx++) {
									const idx =
										((y + ky) * canvas.width + (x + kx)) *
										4;
									minVal = Math.min(minVal, data[idx]);
								}
							}
							const idx = (y * canvas.width + x) * 4;
							temp[idx] = temp[idx + 1] = temp[idx + 2] = minVal;
						}
					}

					// Dilation
					for (let y = 1; y < canvas.height - 1; y++) {
						for (let x = 1; x < canvas.width - 1; x++) {
							let maxVal = 0;
							for (let ky = -1; ky <= 1; ky++) {
								for (let kx = -1; kx <= 1; kx++) {
									const idx =
										((y + ky) * canvas.width + (x + kx)) *
										4;
									maxVal = Math.max(maxVal, temp[idx]);
								}
							}
							const idx = (y * canvas.width + x) * 4;
							data[idx] = data[idx + 1] = data[idx + 2] = maxVal;
						}
					}

					ctx.putImageData(imageData, 0, 0);
					resolve(canvas.toDataURL());
				} catch (error) {
					reject(error);
				}
			};
			img.src = imageData;
		});
	};

	const detectInputPlaceholders = (text: string): Map<string, string> => {
		const lines = text.split("\n").map((line) => line.trim());
		const fieldPairs = new Map<string, string>();

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Detect lines with dots/underscores/blanks as placeholders
			const dotsMatch = line.match(
				/^(.+?)\s*[:*-]?\s*(\.{3,}|_{3,}|\s{5,})(.*)$/
			);
			if (dotsMatch) {
				const label = dotsMatch[1].trim();
				const placeholder = dotsMatch[2].trim();
				const suffix = dotsMatch[3].trim();

				if (label.length > 2 && label.length < 100) {
					fieldPairs.set(
						label,
						`[${placeholder}]${suffix ? ` ${suffix}` : ""}`
					);
				}
			}

			// Detect label followed by blank line or next line with dots
			if (i < lines.length - 1) {
				const nextLine = lines[i + 1];
				const labelPatterns = [
					/^[A-Z][a-zA-Z\s]{2,}[:*-]?\s*$/,
					/^[A-Z][a-zA-Z\s]*\s+[:*]\s*$/,
				];

				const placeholderPatterns = [
					/^\.{3,}|_{3,}|\s{5,}$/,
					/^\[.*\]$/,
					/^___+$/,
				];

				if (
					labelPatterns.some((p) => p.test(line)) &&
					placeholderPatterns.some((p) => p.test(nextLine))
				) {
					const label = line.replace(/[:*-]+\s*$/, "").trim();
					if (label.length > 2 && label.length < 100) {
						fieldPairs.set(label, `[${nextLine.trim()}]`);
					}
				}
			}
		}

		return fieldPairs;
	};

	const extractLabelsWithConfidence = (
		text: string,
		confidence: number
	): {
		labels: string[];
		scores: Map<string, number>;
		fieldPairs: Map<string, string>;
	} => {
		const lines = text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		const labels: string[] = [];
		const scores = new Map<string, number>();
		const seenLabels = new Set<string>();

		const fieldPairs = detectInputPlaceholders(text);

		const formKeywords =
			/\b(Name|Email|Phone|Mobile|Address|Date|Signature|Admission|Branch|Semester|Course|Room|Diet|Blood|Sex|Male|Female|Gender|Age|DOB|Birth|Father|Mother|Parent|Guardian|Emergency|Contact|Vegetarian|Non-Vegetarian|Faculty|Warden|Manager|Office|Reason|Stay|Required|Application|Hostel|Student|Year|Photo|Type|ID|Number|From|To|Period|Duration|Registration|Roll|Enrollment|Department|Class|Section|Marks|Grade|Fee|Payment|Amount|Remarks|Approved|Verified|Checked|Issued|Signature|Designation|Stamp|Seal|Authorized|Certified|Submitted|Received|Processed|Status|Remarks|Notes|Comments|Additional|Special|Preference|Choice|Option|Category|Quota|Merit|Rank|Score|Percentage|Division|Result|Pass|Fail|Absent|Present|Attendance|Conduct|Behavior|Discipline|Uniform|Shoes|Tie|Badge|ID|Card|Proof|Document|Certificate|Diploma|Degree|License|Permit|Visa|Passport|PAN|Aadhar|Voter|Driving|Insurance|Bank|Account|IFSC|MICR|Cheque|Draft|Transfer|Deposit|Withdrawal|Balance|Statement|Ledger|Voucher|Receipt|Invoice|Bill|Estimate|Quotation|Order|Delivery|Tracking|Shipment|Cargo|Freight|Customs|Duty|Tax|GST|VAT|Discount|Rebate|Refund|Claim|Complaint|Feedback|Review|Rating|Comment|Suggestion|Recommendation|Approval|Rejection|Pending|Cancelled|Completed|Submitted|Received|Processed|Verified|Approved|Rejected|Pending|On Hold|In Progress|Completed|Cancelled|Archived|Deleted|Restored|Updated|Modified|Created|Edited|Reviewed|Approved|Signed|Sealed|Stamped|Notarized|Witnessed|Attested|Certified|Authorized|Endorsed|Countersigned|Initialed|Dated|Timed|Logged|Recorded|Documented|Filed|Stored|Archived|Backed Up|Restored|Recovered|Migrated|Transferred|Exported|Imported|Synchronized|Replicated|Distributed|Shared|Published|Posted|Uploaded|Downloaded|Streamed|Cached|Buffered|Compressed|Encrypted|Decrypted|Hashed|Signed|Verified|Validated|Authenticated|Authorized|Permitted|Allowed|Denied|Blocked|Restricted|Limited|Unlimited|Conditional|Provisional|Temporary|Permanent|Fixed|Variable)\b/i;

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			if (line.length < 2 || line.length > 200) continue;

			line = line
				// Fix common character confusions
				.replace(/[|]/g, "I")
				.replace(/[0O]/g, (match, offset) => {
					const nextChar = line[offset + 1];
					const prevChar = line[offset - 1];
					// Better context for O vs 0
					if (/[a-zA-Z]/.test(nextChar) || /[a-zA-Z]/.test(prevChar)) return "O";
					if (/[0-9]/.test(nextChar) || /[0-9]/.test(prevChar)) return "0";
					return match;
				})
				.replace(/[1l]/g, (match, offset) => {
					const prevChar = line[offset - 1];
					const nextChar = line[offset + 1];
					if (/[a-zA-Z]/.test(prevChar) || /[a-zA-Z]/.test(nextChar)) return "l";
					if (/[0-9]/.test(prevChar) || /[0-9]/.test(nextChar)) return "1";
					return match;
				})
				// Fix bracket and parenthesis recognition
				.replace(/\(/g, "(")
				.replace(/\)/g, ")")
				.replace(/\[/g, "[")
				.replace(/\]/g, "]")
				.replace(/\{/g, "{")
				.replace(/\}/g, "}")
				// Fix colon recognition (common OCR error)
				.replace(/[.;,]/g, (match) => {
					// Check if this should be a colon based on context
					const beforeMatch = line.substring(0, line.indexOf(match));
					const afterMatch = line.substring(line.indexOf(match) + 1);
					
					// If it's at the end of a label word, likely should be colon
					if (beforeMatch.trim().split(/\s+/).pop()?.length > 0 && 
						afterMatch.trim().length === 0) {
						return ":";
					}
					return match;
				})
				// Fix common form field pattern misrecognitions
				.replace(/\[\s*\]/g, "[ ]")
				.replace(/\(\s*\)/g, "( )")
				.replace(/\s+:\s+/g, ": ")
				.replace(/\s*:\s*$/, ":")
				// Fix dot patterns in forms
				.replace(/\.{3,}/g, "...")
				.replace(/\s+\.\s+/g, ". ")
				.replace(/\s+\.$/, ".");

			if (/^\d+[\d/\-:.]*$/.test(line)) continue;

			const specialCharCount = (
				line.match(/[^a-zA-Z0-9\s\-:().,/&*]/g) || []
			).length;
			if (specialCharCount > line.length * 0.6) continue;

			const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
			if (alphaCount < 2) continue;

			const labelPatterns = [
				/^[A-Z][a-zA-Z\s]{2,}[:*\-_]/,
				/[:*]\s*$/,
				/^\d+[.)]\s*[A-Z]/,
				/^[A-Z][a-zA-Z\s]{1,}\s+\$[A-Za-z\s/]+$/,
				/^[A-Z][a-zA-Z\s]*\s+\$.*$/,
			];

			const isLabel =
				labelPatterns.some((pattern) => pattern.test(line)) ||
				(formKeywords.test(line) && line.length < 100);

			if (isLabel) {
				const normalized = line
					.replace(/[:*\-_]+\s*$/, "")
					.replace(/^\d+[.)]\s*/, "")
					.trim();

				const lowerNorm = normalized.toLowerCase();
				if (!seenLabels.has(lowerNorm) && normalized.length >= 2) {
					labels.push(normalized);
					seenLabels.add(lowerNorm);

					let score = confidence;

					if (fieldPairs.has(normalized)) {
						score += 25;
					}

					if (formKeywords.test(normalized)) score += 15;
					if (normalized.includes(":")) score += 10;
					if (normalized.length > 10 && normalized.length < 80)
						score += 5;
					if (/^[A-Z]/.test(normalized)) score += 5;

					scores.set(normalized, Math.min(100, score));
				}
			}
		}

		return { labels, scores, fieldPairs };
	};

	const extractLabelsWithSpatialAnalysis = async (
		preprocessedImage: string
	): Promise<{
		labels: string[];
		fieldPairs: Map<
			string,
			{ label: string; inputArea: any; confidence: number }
		>;
		rawTSV: string;
	}> => {
		const Tesseract = (await import("tesseract.js")).default;

		// Use TSV output format to get spatial information
		const result = await Tesseract.recognize(preprocessedImage, "eng", {
			logger: (m: any) => {
				if (m.status === "recognizing text") {
					console.log(
						"[v0] OCR Progress:",
						(m.progress * 100).toFixed(0) + "%"
					);
				}
			},
		});

		const tsvData = result.data.tsv || result.data.text || "";
		if (!tsvData) {
			console.log("[v0] No TSV data available, using text fallback");
			// Fallback to text-based extraction if TSV is not available
			const text = result.data.text || "";
			const {
				labels,
				scores,
				fieldPairs: textFieldPairs,
			} = extractLabelsWithConfidence(text, 50);
			return {
				labels,
				fieldPairs: new Map(
					labels.map((label) => [
						label,
						{
							label,
							inputArea: { x: 0, y: 0, width: 0, height: 0 },
							confidence: scores.get(label) || 50,
						},
					])
				),
				rawTSV: text,
			};
		}

		const lines = tsvData.split("\n");

		// Parse TSV to extract spatial information
		const words: Array<{
			text: string;
			x: number;
			y: number;
			width: number;
			height: number;
			confidence: number;
			lineNum: number;
		}> = [];

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			if (!line || !line.trim()) continue;

			const parts = line.split("\t");
			if (parts.length < 12 || parts[0] !== "5") continue; // level 5 = word level

			const x = Number.parseInt(parts[6]);
			const y = Number.parseInt(parts[7]);
			const width = Number.parseInt(parts[8]);
			const height = Number.parseInt(parts[9]);
			const confidence = Number.parseInt(parts[10]);

			if (
				isNaN(x) ||
				isNaN(y) ||
				isNaN(width) ||
				isNaN(height) ||
				isNaN(confidence)
			)
				continue;

			const word = {
				text: parts[11] || "",
				x,
				y,
				width,
				height,
				confidence,
				lineNum: Number.parseInt(parts[4]) || 0,
			};

			if (word.text && word.confidence > 0) {
				words.push(word);
			}
		}

		if (words.length === 0) {
			console.log(
				"[v0] No words extracted from TSV, using text fallback"
			);
			const text = result.data.text || "";
			const { labels, scores } = extractLabelsWithConfidence(text, 50);
			return {
				labels,
				fieldPairs: new Map(
					labels.map((label) => [
						label,
						{
							label,
							inputArea: { x: 0, y: 0, width: 0, height: 0 },
							confidence: scores.get(label) || 50,
						},
					])
				),
				rawTSV: text,
			};
		}

		// Group words into lines based on Y coordinate
		const lineGroups = new Map<number, typeof words>();
		for (const word of words) {
			const lineKey = Math.round(word.y / 20) * 20; // Group by approximate line height
			if (!lineGroups.has(lineKey)) {
				lineGroups.set(lineKey, []);
			}
			lineGroups.get(lineKey)!.push(word);
		}

		// Sort lines by Y coordinate
		const sortedLines = Array.from(lineGroups.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([_, words]) => words.sort((a, b) => a.x - b.x));

		const labels: string[] = [];
		const fieldPairs = new Map<
			string,
			{ label: string; inputArea: any; confidence: number }
		>();
		const seenLabels = new Set<string>();

		for (let lineIdx = 0; lineIdx < sortedLines.length; lineIdx++) {
			const lineWords = sortedLines[lineIdx];
			const lineText = lineWords.map((w) => w.text).join(" ");

			// Check if this line contains a label (ends with colon, dash, or asterisk)
			const labelMatch = lineText.match(/^(.+?)\s*[:*\-_]\s*$/);
			if (labelMatch) {
				const labelText = labelMatch[1].trim();

				// Check if next line contains input placeholder (dots, underscores, or blank space)
				if (lineIdx + 1 < sortedLines.length) {
					const nextLineWords = sortedLines[lineIdx + 1];
					const nextLineText = nextLineWords
						.map((w) => w.text)
						.join(" ");

					// Detect input placeholders
					const hasPlaceholder =
						/^\.{3,}|_{3,}|\[.*\]|^[\s]{5,}$/.test(nextLineText) ||
						nextLineWords.some((w) =>
							/^\.{3,}|_{3,}$/.test(w.text)
						);

					if (
						hasPlaceholder &&
						labelText.length > 2 &&
						labelText.length < 100
					) {
						const lowerLabel = labelText.toLowerCase();
						if (!seenLabels.has(lowerLabel)) {
							labels.push(labelText);
							seenLabels.add(lowerLabel);

							// Calculate average confidence for the label
							const labelConfidence = Math.round(
								lineWords.reduce(
									(sum, w) => sum + w.confidence,
									0
								) / lineWords.length
							);

							fieldPairs.set(labelText, {
								label: labelText,
								inputArea: {
									x: nextLineWords[0]?.x || 0,
									y: nextLineWords[0]?.y || 0,
									width:
										(nextLineWords[nextLineWords.length - 1]
											?.x || 0) -
										(nextLineWords[0]?.x || 0),
									height: nextLineWords[0]?.height || 0,
								},
								confidence: labelConfidence,
							});
						}
					}
				}
			}

			// Also detect labels that are on the same line as input placeholders
			const inlineMatch = lineText.match(
				/^(.+?)\s*[:*\-_]\s*(\.{3,}|_{3,}|\[.*\]|[\s]{5,})(.*)$/
			);
			if (inlineMatch) {
				const labelText = inlineMatch[1].trim();
				const placeholder = inlineMatch[2].trim();

				if (labelText.length > 2 && labelText.length < 100) {
					const lowerLabel = labelText.toLowerCase();
					if (!seenLabels.has(lowerLabel)) {
						labels.push(labelText);
						seenLabels.add(lowerLabel);

						const labelConfidence = Math.round(
							lineWords.reduce(
								(sum, w) => sum + w.confidence,
								0
							) / lineWords.length
						);

						fieldPairs.set(labelText, {
							label: labelText,
							inputArea: {
								x: lineWords[0]?.x || 0,
								y: lineWords[0]?.y || 0,
								width:
									(lineWords[lineWords.length - 1]?.x || 0) -
									(lineWords[0]?.x || 0),
								height: lineWords[0]?.height || 0,
							},
							confidence: labelConfidence,
						});
					}
				}
			}
		}

		return {
			labels,
			fieldPairs,
			rawTSV: tsvData,
		};
	};

	const handleImageUpload = async (file: File) => {
		if (!file || (!file.type.startsWith("image/") && file.type !== "application/pdf")) {
			alert("Please select a valid image or PDF file");
			return;
		}

		// Import PDF processing utilities
		const { isPdfFile, convertPdfToImages } = await import("../utils/pdf-processor");

		let imageData: string;

		if (isPdfFile(file)) {
			// Handle PDF file
			const images = await convertPdfToImages(file);
			if (images.length === 0) {
				throw new Error("No pages found in PDF");
			}
			// Use the first page for now (could be extended to handle multiple pages)
			imageData = images[0];
		} else {
			// Handle image file
			const reader = new FileReader();
			imageData = await new Promise<string>((resolve, reject) => {
				reader.onload = (e) => {
					const result = e.target?.result as string;
					if (!result) {
						reject(new Error("Failed to load image data"));
					} else {
						resolve(result);
					}
				};
				reader.onerror = () => reject(new Error("Failed to read file"));
				reader.readAsDataURL(file);
			});
		}

		setUploadedImage(imageData);
		setIsProcessing(true);
		setProcessingStages([]);
		setRawOCRText("");
		setPreprocessedImage(null);
		setFormTypeInfo(null);

		try {
			const stages: IStage[] = [];

			// Stage 1: Preprocessing
			stages.push({
				name: "Preprocessing",
				status: "processing",
				description: "Applying advanced image enhancement...",
			});
			setProcessingStages([...stages]);

			const preprocessed = await preprocessImage(imageData);
			setPreprocessedImage(preprocessed);

			stages[0] = {
				name: "Preprocessing",
				status: "complete",
				description:
					"Applied contrast enhancement, Otsu thresholding, despeckling, and morphological operations",
			};
			setProcessingStages([...stages]);

			// Stage 2: Spatial OCR with TSV
			stages.push({
				name: "Spatial OCR Analysis",
				status: "processing",
				description:
					"Running Tesseract with spatial information (TSV mode)...",
			});
			setProcessingStages([...stages]);

				const {
				labels: spatialLabels,
				fieldPairs,
				rawTSV,
			} = await extractLabelsWithSpatialAnalysis(preprocessed);

			stages[1] = {
				name: "Spatial OCR Analysis",
				status: "complete",
				description: `Extracted ${spatialLabels.length} labels with spatial coordinates`,
			};
			setProcessingStages([...stages]);

			// Stage 3: Form Type Detection
			stages.push({
				name: "Form Type Detection",
				status: "processing",
				description: "Analyzing form structure and type...",
			});
			setProcessingStages([...stages]);

			const ocrText = spatialLabels.join("\n");
			const {
				type: detectedType,
				config: formConfig,
				confidence: typeConfidence,
			} = detectFormType(ocrText);

			stages[2] = {
				name: "Form Type Detection",
				status: "complete",
				description: `Detected: ${
					formConfig.name
				} (${typeConfidence.toFixed(0)}% confidence)`,
			};
			setProcessingStages([...stages]);

			// Stage 4: Confidence Scoring with Spatial Data
			stages.push({
				name: "Confidence Scoring",
				status: "processing",
				description:
					"Applying confidence scoring based on spatial analysis...",
			});
			setProcessingStages([...stages]);

			const scores = new Map<string, number>();
			fieldPairs.forEach((fieldData, label) => {
				let score = fieldData.confidence;

				// Boost confidence for labels with detected input areas
				score += 30;

				if (
					formConfig.keywords.some((kw) =>
						new RegExp(`\\b${kw}\\b`, "i").test(label)
					)
				) {
					score += formConfig.confidence_boost;
				}
				if (label.includes(":")) score += 10;
				if (label.length > 10 && label.length < 80) score += 5;
				if (/^[A-Z]/.test(label)) score += 5;

				scores.set(label, Math.min(100, score));
			});
			setConfidenceScores(scores);

				stages[3] = {
				name: "Confidence Scoring",
				status: "complete",
				description: `Confidence scoring completed for ${spatialLabels.length} labels`,
			};
			setProcessingStages([...stages]);

			// Apply post-processing to improve accuracy
			const processedLabels = postProcessOCRResults(spatialLabels);
			setExtractedLabels(processedLabels);
			setRawOCRText(ocrText);
			setFormTypeInfo({
				type: detectedType,
				config: formConfig,
				typeConfidence,
				metadata: { detectedSections: [], fieldGroups: {} },
			});
		} catch (error) {
			console.error("Error in OCR pipeline:", error);
			setExtractedLabels([]);
			setProcessingStages([
				{
					name: "Error",
					status: "failed",
					description: `Pipeline failed: ${
						error instanceof Error
							? error.message
							: "Unknown error"
					}`,
				},
			]);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
			handleImageUpload(file);
		}
	};

	const downloadLabels = (format: "txt" | "json") => {
		if (!extractedLabels || extractedLabels.length === 0) return;

		let content: string;
		let filename: string;
		let mimeType: string;

		if (format === "json") {
			const labelsWithScores = extractedLabels.map((label: string) => ({
				label,
				confidence: confidenceScores.get(label) || 0,
			}));

			content = JSON.stringify(
				{
					extractedAt: new Date().toISOString(),
					totalLabels: extractedLabels.length,
					labels: labelsWithScores,
					rawOCRText: rawOCRText,
				},
				null,
				2
			);
			filename = "extracted-labels.json";
			mimeType = "application/json";
		} else {
			content = extractedLabels
				.map((label: string) => {
					const score = confidenceScores.get(label) || 0;
					return `${label} [Confidence: ${score.toFixed(1)}%]`;
				})
				.join("\n");
			filename = "extracted-labels.txt";
			mimeType = "text/plain";
		}

		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<main className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8 text-center">
					<h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
						Form Label Extractor
					</h1>
					<p className="text-lg text-slate-300">
						Advanced OCR with contrast enhancement, despeckling,
						confidence scoring, and morphological processing
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Upload Section */}
					<div className="space-y-4">
						<div
							onDrop={handleDrop}
							onDragOver={(e) => e.preventDefault()}
							className="bg-slate-800/50 backdrop-blur border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors"
						>
							<Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
							<h3 className="text-xl font-semibold text-white mb-2">
								Upload Form Document
							</h3>
							<p className="text-slate-400 mb-4">
								Supports PDF files and images (PNG, JPG, etc.)
							</p>
							<input
								type="file"
								accept="image/*,.pdf"
								onChange={(e) =>
									e.target.files?.[0] &&
									handleImageUpload(e.target.files[0])
								}
								className="hidden"
								id="file-upload"
								disabled={isProcessing}
							/>
							<label
								htmlFor="file-upload"
								className={`inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition-colors ${
									isProcessing
										? "opacity-50 cursor-not-allowed"
										: ""
								}`}
							>
								{isProcessing
									? "Processing..."
									: "Select Image"}
							</label>
						</div>

						{uploadedImage && (
							<div className="bg-slate-800/50 backdrop-blur rounded-xl p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-lg font-semibold text-white">
										Original Image
									</h3>
									{preprocessedImage && (
										<button
											onClick={() =>
												setShowPreprocessed(
													!showPreprocessed
												)
											}
											className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
										>
											{showPreprocessed ? (
												<EyeOff className="w-4 h-4" />
											) : (
												<Eye className="w-4 h-4" />
											)}
											{showPreprocessed
												? "Original"
												: "Preprocessed"}
										</button>
									)}
								</div>
								<img
									src={
										showPreprocessed && preprocessedImage
											? preprocessedImage
											: uploadedImage
									}
									alt="Form"
									className="w-full rounded-lg border border-slate-700"
								/>
							</div>
						)}
					</div>

					{/* Processing Pipeline */}
					<div className="bg-slate-800/50 backdrop-blur rounded-xl p-6">
						<h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
							<FileText className="w-5 h-5" />
							Processing Pipeline
						</h3>
						<div className="space-y-3">
							{processingStages.length === 0 ? (
								<p className="text-slate-400 text-center py-8">
									Waiting for image upload...
								</p>
							) : (
								processingStages.map((stage, index) => (
									<div
										key={index}
										className="bg-slate-700/50 rounded-lg p-4"
									>
										<div className="flex items-start gap-3">
											{stage.status === "complete" && (
												<CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
											)}
											{stage.status === "processing" && (
												<Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
											)}
											{stage.status === "failed" && (
												<XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
											)}
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold text-white mb-1">
													{stage.name}
												</h4>
												<p className="text-sm text-slate-300">
													{stage.description}
												</p>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Results */}
					<div className="bg-slate-800/50 backdrop-blur rounded-xl p-6">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-xl font-semibold text-white">
									Extracted Labels
								</h3>
								{formTypeInfo && (
									<p className="text-sm text-slate-400 mt-1">
										Form Type:{" "}
										<span className="text-blue-400 font-medium">
											{formTypeInfo.config.name}
										</span>
										<span className="text-slate-500 ml-2">
											(
											{formTypeInfo.typeConfidence.toFixed(
												0
											)}
											% confidence)
										</span>
									</p>
								)}
							</div>
							{extractedLabels && extractedLabels.length > 0 && (
								<div className="flex gap-2">
									<button
										onClick={() => downloadLabels("txt")}
										className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
									>
										<Download className="w-4 h-4" />
										TXT
									</button>
									<button
										onClick={() => downloadLabels("json")}
										className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
									>
										<Download className="w-4 h-4" />
										JSON
									</button>
								</div>
							)}
						</div>

						{formTypeInfo &&
							formTypeInfo.metadata.detectedSections.length >
								0 && (
								<div className="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
									<p className="text-xs font-semibold text-slate-300 mb-2">
										Detected Sections:
									</p>
									<div className="flex flex-wrap gap-2">
										{formTypeInfo.metadata.detectedSections.map(
											(section: string, idx: number) => (
												<span
													key={idx}
													className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs"
												>
													{section}
												</span>
											)
										)}
									</div>
								</div>
							)}

						<div className="space-y-2 max-h-[600px] overflow-y-auto">
							{!extractedLabels ? (
								<p className="text-slate-400 text-center py-8">
									No labels extracted yet
								</p>
							) : extractedLabels.length === 0 ? (
								<p className="text-slate-400 text-center py-8">
									No labels found in image
								</p>
							) : (
								extractedLabels.map(
									(label: string, index: number) => {
										const score =
											confidenceScores.get(label) || 0;
										return (
											<div
												key={index}
												className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors"
											>
												<div className="flex items-start justify-between gap-2">
													<p className="text-white font-medium flex-1">
														{label}
													</p>
													<span
														className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
															score >= 80
																? "bg-green-900/50 text-green-300"
																: score >= 60
																? "bg-yellow-900/50 text-yellow-300"
																: "bg-red-900/50 text-red-300"
														}`}
													>
														{score.toFixed(0)}%
													</span>
												</div>
											</div>
										);
									}
								)
							)}
						</div>

						{rawOCRText && (
							<details className="mt-4">
								<summary className="cursor-pointer text-slate-300 hover:text-white font-medium">
									View Raw OCR Text
								</summary>
								<pre className="mt-3 p-3 bg-slate-900 rounded-lg text-xs text-slate-300 max-h-60 overflow-auto">
									{rawOCRText}
								</pre>
							</details>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
