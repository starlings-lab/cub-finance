import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const TableRowWrapper = () => {
  return (
    <TableRow className="animate-pulse">
      <TableCell>
        <div className="h-3 w-10 bg-gray-300 rounded" />
      </TableCell>
      <TableCell>
        <div className="flex">
          <div className="h-7 w-7 rounded-full bg-gray-300 mr-1.5" />
          <div className="h-7 w-7 rounded-full bg-gray-300" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex">
          <div className="h-7 w-7 rounded-full bg-gray-300 mr-1.5" />
          <div className="h-7 w-7 rounded-full bg-gray-300 mr-1.5" />
          <div className="h-7 w-7 rounded-full bg-gray-300" />
        </div>
      </TableCell>
      <TableCell>
        <div className="h-3 w-20 bg-gray-300 rounded" />
      </TableCell>
      <TableCell>
        <div className="h-3 w-20 bg-gray-300 rounded" />
      </TableCell>
      <TableCell>
        <div className="h-3 w-10 bg-gray-300 rounded" />
      </TableCell>
      <TableCell>
        <div className="h-3 w-10 bg-gray-300 rounded" />
      </TableCell>
      <TableCell>
        <div className="h-3 w-10 bg-gray-300 rounded" />
      </TableCell>
      <TableCell>
        <div className="h-3 w-10 bg-gray-300 rounded" />
      </TableCell>
      <TableCell>
        <div className="h-3 w-10 bg-gray-300 rounded" />
      </TableCell>
    </TableRow>
  );
};

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="max-w-screen-xl mx-auto py-8">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocol</TableHead>
              <TableHead>Debt Tokens</TableHead>
              <TableHead>Collateral Tokens</TableHead>
              <TableHead>Total Debt Amount</TableHead>
              <TableHead>Total Collateral Amount</TableHead>
              <TableHead>LTV</TableHead>
              <TableHead>Max LTV</TableHead>
              <TableHead>Net APY</TableHead>
              <TableHead>Lending APY</TableHead>
              <TableHead>Borrowing APY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          <TableRowWrapper/>
          <TableRowWrapper/>
          <TableRowWrapper/>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
