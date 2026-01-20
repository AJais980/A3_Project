"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import institutions from "@/data/institutions.json";

interface InstitutionSelectorProps {
	designation: "STUDENT" | "TEACHER" | "WORKING_PROFESSIONAL";
	onSelect: (institution: string, domain: string) => void;
	selected?: string;
}

export default function InstitutionSelector({
	designation,
	onSelect,
	selected,
}: InstitutionSelectorProps) {
	const [searchTerm, setSearchTerm] = useState("");

	// Get institutions based on designation
	const getInstitutions = () => {
		switch (designation) {
			case "STUDENT":
				return [...institutions.colleges, ...institutions.universities];
			case "TEACHER":
				return [...institutions.colleges, ...institutions.universities];
			case "WORKING_PROFESSIONAL":
				return institutions.companies;
			default:
				return [];
		}
	};

	const allInstitutions = getInstitutions();

	// Filter institutions based on search term
	const filteredInstitutions = useMemo(() => {
		return allInstitutions.filter((inst) =>
			inst.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [searchTerm, allInstitutions]);

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "college":
				return "College";
			case "university":
				return "University";
			case "company":
				return "Company";
			default:
				return type;
		}
	};

	return (
		<div className="space-y-4 overflow-hidden">
			<h3 className="text-lg font-semibold text-white">
				Select Your {designation === "WORKING_PROFESSIONAL" ? "Company" : "Institution"}
			</h3>

			{/* Search Input */}
			<div className="relative">
				<Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
				<Input
					type="text"
					placeholder="Search..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
				/>
			</div>

			{/* Institution List */}
			<motion.div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
				{filteredInstitutions.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-400">No institutions found</p>
					</div>
				) : (
					filteredInstitutions.map((institution, index) => (
						<motion.button
							key={`${institution.id}-${index}`}
							whileHover={{ x: 4 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => onSelect(institution.name, institution.domain)}
							className={`w-full p-3 rounded-lg transition-all duration-200 text-left border border-gray-700 overflow-hidden ${selected === institution.name
								? "bg-linear-to-r from-purple-500/30 to-pink-500/30 border-purple-500/50 shadow-lg shadow-purple-500/20"
								: "bg-gray-900/50 hover:bg-gray-800/70 hover:border-gray-600"
								}`}
						>
							<div className="flex items-center justify-between">
								<div className="flex-1 min-w-0">
									<p className="font-medium text-white text-sm sm:text-base truncate">
										{institution.name}
									</p>
									<p className="text-xs text-gray-400 mt-1">
										{getTypeLabel(institution.type)}
									</p>
								</div>
								{selected === institution.name && (
									<motion.div
										layoutId="selected"
										className="w-2 h-2 rounded-full bg-linear-to-r from-purple-500 to-pink-500"
										transition={{ type: "spring", stiffness: 300, damping: 30 }}
									/>
								)}
							</div>
						</motion.button>
					))
				)}
			</motion.div>
		</div>
	);
}
