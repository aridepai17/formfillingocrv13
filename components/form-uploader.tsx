"use client";

import React from "react";

import { useState, useRef } from "react";
import { Upload, FileImage } from "lucide-react";

interface FormUploaderProps {
	onUpload: (file: File) => void;
	isProcessing: boolean;
}

export default function FormUploader({
	onUpload,
	isProcessing,
}: FormUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			onUpload(files[0]);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.currentTarget.files;
		if (files && files.length > 0) {
			onUpload(files[0]);
		}
	};

	return (
		<div className="bg-slate-800 rounded-lg border border-slate-700 p-8 h-full flex flex-col justify-center">
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
					isDragging
						? "border-blue-400 bg-blue-500/10"
						: "border-slate-600 hover:border-slate-500"
				} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
				onClick={() => !isProcessing && fileInputRef.current?.click()}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileSelect}
					disabled={isProcessing}
					className="hidden"
				/>

				<div className="flex flex-col items-center gap-3">
					{isProcessing ? (
						<>
							<div className="animate-spin">
								<FileImage className="w-12 h-12 text-blue-400" />
							</div>
							<p className="text-slate-300 font-medium">
								Processing...
							</p>
						</>
					) : (
						<>
							<Upload className="w-12 h-12 text-slate-400" />
							<div>
								<p className="text-white font-semibold">
									Upload Form Image
								</p>
								<p className="text-slate-400 text-sm mt-1">
									Drag and drop or click to select
								</p>
							</div>
						</>
					)}
				</div>
			</div>

			<div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
				<p className="text-xs text-slate-400">
					<span className="font-semibold text-slate-300">
						Supported formats:
					</span>{" "}
					PNG, JPG, PDF
				</p>
			</div>
		</div>
	);
}
