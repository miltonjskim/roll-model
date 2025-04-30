"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const SelectDataPage = () => {
	const [file, setFile] = useState<File | null>(null);
	const [fileEnter, setFileEnter] = useState(false);

	// 파일 확장자 검사 함수
	const isAllowedFile = (file: File) => {
		const allowedExtensions = ["csv", "parquet"];
		const extension = file.name.split(".").pop()?.toLowerCase();
		return extension && allowedExtensions.includes(extension);
	};

	const handleUploadFile = (file: File) => {};

	const handleUseSampleData = () => {
		console.log("use sample data");
	};

	return (
		<div>
			<div>
				<h1>프로젝트 데이터 선택</h1>
				<h2>데이터를 선택해 주세요</h2>
			</div>

			<div>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="black">로컬 파일 사용하기</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader className="text-center">
							<DialogTitle>로컬 데이터 업로드</DialogTitle>
							<DialogDescription>
								파일을 드래그하거나,
								<br />
								아래의 찾아보기 버튼을 클릭해
								<br />
								데이터를 업로드 하세요.
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="container px-4 max-w-5xl mx-auto">
								{!file ? (
									<div
										onDragOver={(e) => {
											e.preventDefault();
											setFileEnter(true);
										}}
										onDragLeave={(e) => {
											setFileEnter(false);
										}}
										onDragEnd={(e) => {
											e.preventDefault();
											setFileEnter(false);
										}}
										onDrop={(e) => {
											e.preventDefault();
											setFileEnter(false);
											const droppedFile = e.dataTransfer.files?.[0];
											if (droppedFile && isAllowedFile(droppedFile)) {
												setFile(droppedFile);
											} else {
												alert("csv 또는 parquet 파일만 업로드 가능합니다.");
											}
										}}
										className={`${fileEnter ? "border-4" : "border-2"} mx-auto  bg-white flex flex-col w-full max-w-xs h-72 border-dashed items-center justify-center`}>
										<label
											htmlFor="file"
											className="h-full flex flex-col justify-center text-center">
											Click to upload or drag and drop
										</label>
										<input
											id="file"
											type="file"
											accept=".csv, .parquet"
											className="hidden"
											onChange={(e) => {
												const uploaded = e.target.files?.[0];
												if (uploaded && isAllowedFile(uploaded)) {
													setFile(uploaded);
												} else {
													alert("csv 또는 parquet 파일만 업로드 가능합니다.");
												}
											}}
										/>
									</div>
								) : (
									<div className="flex flex-col items-center">
										<p className="text-sm text-muted-foreground mb-4">{file.name}</p>
										<button
											onClick={() => setFile(null)}
											className="px-4 mt-4 uppercase py-2 tracking-widest outline-none bg-red-600 text-white rounded">
											Reset
										</button>
									</div>
								)}
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="black"
								onClick={() => console.log("파일 저장 로직 필요")}>
								Save changes
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<Button
					variant="outline"
					onClick={handleUseSampleData}>
					샘플 데이터 사용하기
				</Button>
			</div>
		</div>
	);
};

export default SelectDataPage;
