package com.ccc.roll_model.ai.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;

public class CsvUtils {

    /**
     * CSV 파일 내용을 요약: 헤더 + 상위 N개 행 출력
     *
     * @param csvContent 원본 CSV 파일 내용 (UTF-8 문자열)
     * @param maxRows 최대 행 수 (헤더 제외)
     * @return 요약된 텍스트
     */
    public static String summarizeCsv(String csvContent, int maxRows) {
        if (csvContent == null || csvContent.isBlank()) {
            return "CSV is empty.";
        }

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new StringReader(csvContent))) {
            String line;
            int rowCount = 0;

            line = reader.readLine(); // Header
            if (line == null) {
                return "CSV is empty.";
            }

            sb.append("CSV Summary:\n");
            sb.append("Header: ").append(line).append("\n");

            while ((line = reader.readLine()) != null && rowCount < maxRows) {
                sb.append("Row ").append(rowCount + 1).append(": ").append(line).append("\n");
                rowCount++;
            }

            if (reader.readLine() != null) {
                sb.append("... (more rows truncated)\n");
            }

        } catch (IOException e) {
            return "Failed to read CSV content.";
        }

        return sb.toString();
    }
}
