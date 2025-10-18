"use client";

import React from "react";
import { Copy, FileJson, FileText } from "lucide-react";
import { useState } from "react";

interface ResultsDisplayProps {
	labels: any;
	uploadedImage: string | null;
	rawText?: string;
}

export default function ResultsDisplay({
	labels,
	uploadedImage,
	rawText,
}: ResultsDisplayProps) {
	const [copied, setCopied] = useState(false);
	const [showRawText, setShowRawText] = useState(false);

	const copyToClipboard = () => {
		if (labels) {
			navigator.clipboard.writeText(JSON.stringify(labels, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const downloadAsJSON = () => {
		if (labels) {
			const jsonData = {
				extractedAt: new Date().toISOString(),
				totalLabels: Array.isArray(labels)
					? labels.length
					: Object.keys(labels).length,
				labels: labels,
			};
			const element = document.createElement("a");
			element.setAttribute(
				"href",
				"data:application/json;charset=utf-8," +
					encodeURIComponent(JSON.stringify(jsonData, null, 2))
			);
			element.setAttribute(
				"download",
				`extracted-labels-${Date.now()}.json`
			);
			element.style.display = "none";
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element);
		}
	};

	const downloadAsText = () => {
		if (labels) {
			const textData = Array.isArray(labels)
				? labels.join("\n")
				: Object.entries(labels)
						.map(([key, value]) => `${key}: ${value}`)
						.join("\n");

			const element = document.createElement("a");
			element.setAttribute(
				"href",
				"data:text/plain;charset=utf-8," + encodeURIComponent(textData)
			);
			element.setAttribute(
				"download",
				`extracted-labels-${Date.now()}.txt`
			);
			element.style.display = "none";
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element);
		}
	};

	return (
		<div className="bg-slate-800 rounded-lg border border-slate-700 p-8 h-full flex flex-col">
			<h2 className="text-2xl font-bold text-white mb-6">
				Extracted Labels
			</h2>

			{uploadedImage && (
				<div className="mb-6">
					<p className="text-sm text-slate-400 mb-3">Preview:</p>
					<img
						src={uploadedImage || "/placeholder.svg"}
						alt="Uploaded form"
						className="w-full h-40 object-cover rounded-lg border border-slate-600"
					/>
				</div>
			)}

			{labels ? (
				<div className="flex-1 overflow-auto">
					{rawText && (
						<div className="flex gap-2 mb-4">
							<button
								onClick={() => setShowRawText(false)}
								className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
									!showRawText
										? "bg-blue-600 text-white"
										: "bg-slate-700 text-slate-300 hover:bg-slate-600"
								}`}
							>
								Labels
							</button>
							<button
								onClick={() => setShowRawText(true)}
								className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
									showRawText
										? "bg-blue-600 text-white"
										: "bg-slate-700 text-slate-300 hover:bg-slate-600"
								}`}
							>
								Raw OCR Text
							</button>
						</div>
					)}

					{showRawText && rawText ? (
						<div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
							<p className="text-slate-200 whitespace-pre-wrap break-words font-mono text-xs">
								{rawText}
							</p>
						</div>
					) : (
						<>
							{Array.isArray(labels) ? (
								<div className="space-y-3">
									{labels.length > 0 ? (
										labels.map(
											(label: string, index: number) => (
												<div
													key={index}
													className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
												>
													<p className="text-slate-200 text-sm break-words">
														{label}
													</p>
												</div>
											)
										)
									) : (
										<div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
											<p className="text-slate-400 text-sm">
												No labels extracted. Try
												uploading a clearer form image.
											</p>
										</div>
									)}
								</div>
							) : typeof labels === "object" ? (
								<div className="space-y-2">
									{Object.entries(labels).map(
										(
											[key, value]: [string, any],
											index
										) => (
											<div
												key={index}
												className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg"
											>
												<p className="text-slate-400 text-xs font-semibold">
													{key}
												</p>
												<p className="text-slate-200 text-sm mt-1">
													{typeof value === "string"
														? value
														: JSON.stringify(value)}
												</p>
											</div>
										)
									)}
								</div>
							) : (
								<div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
									<p className="text-slate-200 text-sm">
										{String(labels)}
									</p>
								</div>
							)}
						</>
					)}

					{labels && (
						<div className="flex gap-2 mt-6 flex-wrap">
							<button
								onClick={copyToClipboard}
								className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
							>
								<Copy className="w-4 h-4" />
								{copied ? "Copied!" : "Copy"}
							</button>
							<button
								onClick={downloadAsJSON}
								className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
							>
								<FileJson className="w-4 h-4" />
								JSON
							</button>
							<button
								onClick={downloadAsText}
								className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
							>
								<FileText className="w-4 h-4" />
								Text
							</button>
						</div>
					)}
				</div>
			) : (
				<div className="flex-1 flex items-center justify-center">
					<p className="text-slate-400 text-center">
						Upload a form image to see extracted labels here
					</p>
				</div>
			)}
		</div>
	);
}
