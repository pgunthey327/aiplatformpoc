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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

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

        {data.map((trace) => (
          // <Dialog key={trace.id}>
          // <DialogTrigger asChild key={trace.id}>
          <TableRow key={trace.id}
            className="cursor-pointer select-none hover:bg-muted"
            onClick={() =>
              router.push(`/observation/${trace.observations[0]}`)
            }>
            <TableCell
              className="max-w-0 truncate font-medium"
              title={trace.input}
            >
              {trace.input || "-"}
            </TableCell>

            <TableCell
              className="max-w-0 truncate"
              title={trace.output}
            >
              {trace.output || "-"}
            </TableCell>

            <TableCell
              className="truncate"
              title={trace.metadata?.model}
            >
              {trace.metadata?.model || "-"}
            </TableCell>

            <TableCell
              className="hidden md:table-cell truncate"
              title={trace.metadata?.provider}
            >
              {trace.metadata?.provider || "-"}
            </TableCell>

            <TableCell className="hidden lg:table-cell truncate">
              ${trace.totalCost ?? "-"}
            </TableCell>

            <TableCell className="hidden lg:table-cell truncate">
              {trace.latency
                ? `${trace.latency} ms`
                : "-"}
            </TableCell>

            <TableCell
              className="hidden lg:table-cell truncate"
              title={trace.metadata?.inputTokens}
            >
              {trace.metadata?.inputTokens || "-"}
            </TableCell>
            <TableCell
              className="hidden lg:table-cell truncate"
              title={trace.metadata?.outputTokens}
            >
              {trace.metadata?.outputTokens || "-"}
            </TableCell>

            <TableCell
              className="hidden lg:table-cell truncate"
              title={trace.metadata?.totalTokens}
            >
              {trace.metadata?.totalTokens || "-"}
            </TableCell>
          </TableRow>
          //   </DialogTrigger>
          //   <DialogContent className={"w-full"}>
          //     <DialogHeader>
          //       <DialogTitle>Scrollable Content</DialogTitle>
          //       <DialogDescription>
          //         This is a dialog with scrollable content.
          //       </DialogDescription>
          //     </DialogHeader>
          //     <div className="-mx-4 no-scrollbar  max-h-[50vh] overflow-y-auto px-4">
          //       {Array.from({ length: 10 }).map((_, index) => (
          //         <p key={index} className="mb-4 leading-normal">
          //           Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          //           eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
          //           enim ad minim veniam, quis nostrud exercitation ullamco laboris
          //           nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          //           reprehenderit in voluptate velit esse cillum dolore eu fugiat
          //           nulla pariatur. Excepteur sint occaecat cupidatat non proident,
          //           sunt in culpa qui officia deserunt mollit anim id est laborum.
          //         </p>
          //       ))}
          //     </div>
          //   </DialogContent>
          // </Dialog>
        ))}

      </TableBody>
    </Table>
  );
}