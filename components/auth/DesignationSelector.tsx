"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Briefcase, Check } from "lucide-react";

interface DesignationSelectorProps {
	onSelect: (designation: "STUDENT" | "TEACHER" | "WORKING_PROFESSIONAL") => void;
	selected?: string;
}

const designations = [
	{
		id: "STUDENT",
		label: "Student",
		description: "Currently enrolled in a school, college, or university",
		icon: GraduationCap,
		iconGradient: "from-indigo-500 via-purple-500 to-pink-500",
	},
	{
		id: "TEACHER",
		label: "Teacher",
		description: "Educating and mentoring students",
		icon: BookOpen,
		iconGradient: "from-emerald-400 via-teal-500 to-cyan-600",
	},
	{
		id: "WORKING_PROFESSIONAL",
		label: "Professional",
		description: "Working in the industry",
		icon: Briefcase,
		iconGradient: "from-amber-400 via-orange-500 to-red-500",
	},
];

export default function DesignationSelector({ onSelect, selected }: DesignationSelectorProps) {
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold text-white">Select Your Designation</h3>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				{designations.map((designation, index) => {
					const Icon = designation.icon;
					const isSelected = selected === designation.id;

					return (
						<motion.button
							key={designation.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1, duration: 0.3 }}
							whileHover={{ y: -2 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => onSelect(designation.id as "STUDENT" | "TEACHER" | "WORKING_PROFESSIONAL")}
							className={`group relative p-5 rounded-xl transition-all duration-200 border overflow-hidden ${isSelected
								? "border-purple-500/50 bg-purple-500/10"
								: "border-gray-700/50 bg-gray-900/30 hover:bg-gray-800/50 hover:border-gray-600"
								}`}
						>
							{/* Selected indicator */}
							{isSelected && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
								>
									<Check className="w-3 h-3 text-white" />
								</motion.div>
							)}

							<div className="flex flex-col items-center space-y-3">
								<div
									className={`p-3 rounded-xl bg-linear-to-br ${designation.iconGradient} transition-all duration-200`}
								>
									<Icon className="w-6 h-6 text-white" />
								</div>
								<div className="text-center">
									<h4 className={`font-medium text-sm sm:text-base transition-colors duration-200 ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
										}`}>
										{designation.label}
									</h4>
									<p className="text-xs text-gray-500 mt-1 line-clamp-2">
										{designation.description}
									</p>
								</div>
							</div>
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}
