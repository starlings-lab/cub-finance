import React from "react";
import { getUserDebtPositions } from "./getUserDebtPositions";
import { Address } from "abitype";
import { DataTable } from "@/components/ui/data-table";
import { debtTableColumns } from "./debtTableColumns";
import { DebtPositionTableRow } from "@/app/type/type";

const DebtTableWrapper = async ({ userAddress }: { userAddress: string }) => {
  const allDebtPositions: DebtPositionTableRow[] = await getUserDebtPositions(
    userAddress as Address
  );

  return (
    <div className="max-w-screen-xl mx-auto py-8">
      <DataTable columns={debtTableColumns} data={allDebtPositions} />
    </div>
  );
};

export default DebtTableWrapper;
