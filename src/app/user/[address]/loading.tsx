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
    <TableRow className="animate-pulse hover:bg-white">
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

export default function Loading({showHeader = true} : {showHeader?: boolean}) {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="max-w-screen-xl mx-auto pb-4">
      <div className="rounded-md border bg-white">
        <Table>
          {showHeader && <TableHeader>
            <TableRow className="hover:bg-white">
              <TableHead>Protocol</TableHead>
              <TableHead>Debt Tokens</TableHead>
              <TableHead>Collateral Tokens</TableHead>
              <TableHead>Net Borrowing APY</TableHead>
              <TableHead>Debt Amount</TableHead>
              <TableHead>Borrowing APY</TableHead>
              <TableHead>Collateral Amount</TableHead>
              <TableHead>Collateral APY</TableHead>
              <TableHead>Reward APY</TableHead>
              <TableHead>LTV</TableHead>
              <TableHead>Max LTV</TableHead>
            </TableRow>
          </TableHeader>}
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
