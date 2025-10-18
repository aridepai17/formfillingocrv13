"use client";

import React from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IStage {
	name: string;
	status: "processing" | "complete" | "failed" | "pending";
	description: string;
}

interface ProcessingPipelineProps {
	stages: IStage[];
	isProcessing: boolean;
}

export default function ProcessingPipeline({
	stages,
	isProcessing,
}: ProcessingPipelineProps) {
	if (stages.length === 0 && !isProcessing) {
		return (
			<div className="bg-slate-800 rounded-lg border border-slate-700 p-8 h-full flex items-center justify-center">
				<div className="text-center">
					<p className="text-slate-400">Waiting for image upload...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-slate-800 rounded-lg border border-slate-700 p-6 h-full">
			<h3 className="text-lg font-semibold text-white mb-4">
				Processing Pipeline
			</h3>
			<div className="space-y-3">
				<AnimatePresence>
					{stages.map((stage, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
							className="bg-slate-700/50 rounded-lg p-3"
						>
							<div className="flex items-start gap-3">
								{stage.status === "complete" ? (
									<CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
								) : stage.status === "processing" ? (
									<Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
								) : stage.status === "failed" ? (
									<XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
								) : (
									<div className="w-5 h-5 flex-shrink-0 mt-0.5" />
								)}
								<div>
									<h4 className="font-semibold text-white">
										{stage.name}
									</h4>
									<p className="text-sm text-slate-300">
										{stage.description}
									</p>
								</div>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</div>
	);
}
