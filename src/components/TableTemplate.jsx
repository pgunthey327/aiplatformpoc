"use client";

import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  extractInput,
  extractOutput,
  getModel,
  getProvider,
  getTokens,
} from "@/lib/traceUtils";

export function TableTemplate({ data = [],
  sortConfig,
  onSort, }) {
  const router = useRouter();
  return (
    <Table className="w-full  table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead
            className="w-[5%] cursor-pointer select-none"
            onClick={() => onSort("input")}
          >
            Prompt
            {sortConfig?.field === "input" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>
          <TableHead
            className="w-[7%] cursor-pointer select-none"
            onClick={() => onSort("output")}
          >
            Response
            {sortConfig?.field === "output" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>

          <TableHead
            className="w-[2%] cursor-pointer select-none"
            onClick={() => onSort("model")}
          >
            Model
            {sortConfig?.field === "model" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>

          <TableHead
            className="hidden md:table-cell w-[2%] cursor-pointer select-none"
            onClick={() => onSort("provider")}
          >
            Provider
            {sortConfig?.field === "provider" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>

          <TableHead
            className="hidden lg:table-cell w-[2%] cursor-pointer select-none"
            onClick={() => onSort("totalCost")}
          >
            Cost
            {sortConfig?.field === "totalCost" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>

          <TableHead
            className="hidden lg:table-cell w-[2%] cursor-pointer select-none"
            onClick={() => onSort("latency")}
          >
            Latency
            {sortConfig?.field === "latency" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>

          <TableHead
            className="hidden lg:table-cell w-[2%] cursor-pointer select-none truncate"
            onClick={() => onSort("inputTokens")}
          >
            Input Token
            {sortConfig?.field === "inputTokens" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>

          <TableHead
            className="hidden lg:table-cell w-[2%] cursor-pointer select-none truncate"
            onClick={() => onSort("outputTokens")}
          >
            Output Token
            {sortConfig?.field === "outputTokens" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>

          <TableHead
            className="hidden lg:table-cell w-[2%] cursor-pointer select-none truncate"
            onClick={() => onSort("totalTokens")}
          >
            Total Token
            {sortConfig?.field === "totalTokens" &&
              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>

        {data.map((trace) => {
          const input = extractInput(trace.input);
          const output = extractOutput(trace.output);
          const model = getModel(trace);
          const provider = getProvider(trace);
          const { inputTokens, outputTokens, totalTokens } = getTokens(trace);

          return (
            <TableRow key={trace.id}
              className="cursor-pointer select-none hover:bg-muted"
              onClick={() =>
                router.push(`/observation/${trace.observations[0]}`)
              }>
              <TableCell
                className="max-w-0 truncate font-medium"
                title={input}
              >
                {input || "-"}
              </TableCell>

              <TableCell
                className="max-w-0 truncate"
                title={output}
              >
                {output || "-"}
              </TableCell>

              <TableCell
                className="truncate"
                title={model}
              >
                {model || "-"}
              </TableCell>

              <TableCell
                className="hidden md:table-cell truncate"
                title={provider}
              >
                {provider || "-"}
              </TableCell>

              <TableCell className="hidden lg:table-cell truncate">
                ${trace.totalCost ?? "-"}
              </TableCell>

              <TableCell className="hidden lg:table-cell truncate">
                {trace.latency ? `${trace.latency} ms` : "-"}
              </TableCell>

              <TableCell
                className="hidden lg:table-cell truncate"
                title={String(inputTokens)}
              >
                {inputTokens || "-"}
              </TableCell>

              <TableCell
                className="hidden lg:table-cell truncate"
                title={String(outputTokens)}
              >
                {outputTokens || "-"}
              </TableCell>

              <TableCell
                className="hidden lg:table-cell truncate"
                title={String(totalTokens)}
              >
                {totalTokens || "-"}
              </TableCell>
            </TableRow>
          );
        })}

      </TableBody>
    </Table>
  );
}