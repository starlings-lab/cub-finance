import { DebtPositionTableRow } from "@/app/type/type";
import { Card, CardContent } from "@/components/ui/card";
import { getUserDebtPositions } from "./getUserDebtPositions";
import { ethers } from "ethers";
import { Address } from "abitype";
import { DataTable } from "@/components/ui/data-table";
import { debtTableColumns } from "./debtTableColumns";
export default async function DebtPage({
  params
}: {
  params: { address: string };
}) {
  const userAddress = ethers.getAddress(params.address);

  const debtPositions: DebtPositionTableRow[] = await getUserDebtPositions(
    userAddress as Address
  );
  console.dir(debtPositions, { depth: null });

  return (
    <div>
      <div className="w-full p-3 flex justify-between border rounded-md">
        Wallet Address <div className="right font-bold">{params.address}</div>
      </div>
      <div>
        <div className="mt-5 text-4xl">Debt Positions</div>
        <div className="mt-2 text-sm">
          Select a debt position to check refinancing options
        </div>
        <div className="container mx-auto py-10">
          <DataTable columns={debtTableColumns} data={debtPositions} />
        </div>
      </div>
      <Card className="shadow-none">
        <CardContent></CardContent>
      </Card>
    </div>
  );
}
