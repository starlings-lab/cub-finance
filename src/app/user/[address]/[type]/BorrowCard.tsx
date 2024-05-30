import Image from "next/image";
import React from "react";
import PopoverWrapper from "../../../../components/ui/popover";
import ImageWrapper from "../../../../components/ui/image-wrapper";
import { BorrowRecommendationTableRow } from "@/app/type/type";
import { getFormattedTokenAmount } from "@/app/utils/utils";

let USDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const Title = ({
  title,
  iconTitle
}: {
  title: string;
  iconTitle?: boolean;
}) => {
  return (
    <div
      className={`text-xs font-hkGrotesk text-slate-400 ${
        iconTitle ? "mb-2" : ""
      }`}
    >
      {title}
    </div>
  );
};

const PopoverTitleWrapper = ({ title }: { title: string }) => {
  return (
    <div className="flex">
      <div className="mr-2 text-xs font-hkGrotesk text-slate-400 flex items-center">
        {title}
        <span className="ml-2">ⓘ</span>
      </div>
    </div>
  );
};

export const BorrowCardLoading = () => {
  return (
    <div className="border border-slate-300 py-2 mb-4 rounded-lg bg-white">
      <div className="flex items-center justify-between border-b-[0.5px] border-b-slate-300 pb-2 px-2">
        <div className="flex items-center">
          <div className="animate-pulse h-10 w-10 rounded-full bg-gray-300 mr-2" />
          <div className="animate-pulse h-4 w-24 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center">
          <div className="animate-pulse h-3 w-20 rounded-full bg-gray-300" />
          <div className="animate-pulse h-4 w-10 rounded-full bg-gray-300 ml-2" />
        </div>
      </div>
      <div className="px-2 pt-2 flex justify-between">
        <div className="w-4/12">
          <div className="animate-pulse h-2.5 w-20 rounded-full bg-gray-300" />
          <div>
            <div className="animate-pulse h-6 w-6 rounded-full bg-gray-300 mr-2 mt-1" />
          </div>
        </div>
        <div className="flex w-8/12 justify-between">
          <div>
            <div className="animate-pulse h-2.5 w-24 rounded-full bg-gray-300" />
            <div className="animate-pulse h-4 w-10 rounded-full bg-gray-300 mt-1" />
          </div>
          <div className="flex flex-col">
            <div className="animate-pulse h-2.5 w-24 rounded-full bg-gray-300" />
            <div className="animate-pulse h-4 w-10 rounded-full bg-gray-300 mt-1" />
          </div>
        </div>
      </div>
      <div className="px-2 pt-2 flex justify-between">
        <div className="w-4/12">
          <div className="animate-pulse h-2.5 w-20 rounded-full bg-gray-300" />
          <div>
            <div className="animate-pulse h-6 w-6 rounded-full bg-gray-300 mr-2 mt-1" />
          </div>
        </div>
        <div className="flex w-8/12 justify-between">
          <div>
            <div className="animate-pulse h-2.5 w-24 rounded-full bg-gray-300" />
            <div className="animate-pulse h-4 w-10 rounded-full bg-gray-300 mt-1" />
          </div>
          <div className="flex flex-col">
            <div className="animate-pulse h-2.5 w-24 rounded-full bg-gray-300" />
            <div className="animate-pulse h-4 w-10 rounded-full bg-gray-300 mt-1" />
          </div>
        </div>
      </div>
      <div className="px-2 pt-2 flex ">
        <div className="w-4/12">
          <div className="animate-pulse h-2.5 w-24 rounded-full bg-gray-300" />
          <div className="animate-pulse h-4 w-10 rounded-full bg-gray-300 mt-1" />
        </div>
        <div className="flex flex-col w-8/12">
          <div className="animate-pulse h-2.5 w-24 rounded-full bg-gray-300" />
          <div className="animate-pulse h-4 w-10 rounded-full bg-gray-300 mt-1" />
        </div>
      </div>
    </div>
  );
};

const BorrowCard = ({
  optionDetails,
  activeKey
}: {
  optionDetails: BorrowRecommendationTableRow;
  activeKey: string;
}) => {
  const activeSortPillStyle = "text-sm border border-[#009DC42a] bg-[#009DC41a] px-2 rounded-full w-fit"
  const inActiveSortPillStyle = "text-sm"
  const isNetBorrowApy = activeKey === 'trailing30DaysNetBorrowingAPY' ? activeSortPillStyle : inActiveSortPillStyle
  const isBorrowApy = activeKey === 'trailing30DaysBorrowingAPY' ? activeSortPillStyle : inActiveSortPillStyle
  const isCollateralApy = activeKey === 'trailing30DaysLendingAPY' ? activeSortPillStyle : inActiveSortPillStyle
  const isRewardApy = activeKey === 'trailing30DaysRewardAPY' ? activeSortPillStyle : inActiveSortPillStyle
  const isMaxLTV = activeKey === 'maxLTV' ? activeSortPillStyle : inActiveSortPillStyle
  return (
    <div className="border border-slate-300 py-2 mb-8 rounded-lg bg-white">
      <div className="flex items-center justify-between border-b-[0.5px] border-b-slate-300 pb-2 px-2">
        <div className="flex items-center">
          <Image
            src={`/${optionDetails.protocol.toLowerCase()}.png`}
            height={25}
            width={25}
            alt="aav3 protocol"
            className="rounded-full mr-2"
          />
          <div className="text-sm text-slate-800">{optionDetails.protocol}</div>
        </div>
        <div className="flex items-center">
          <PopoverWrapper
            title={<PopoverTitleWrapper title="Net Borrowing APY" />}
            content={
              <div>
                <div className="text-xs text-slate-800">
                  Trailing 30 days Net Borrowing APY = (Lending Interest -
                  Borrowing Interest) / Debt Amount.
                  <br />
                  Positive value means user will earn interest and negative
                  value means user will pay interest.
                </div>
              </div>
            }
          />
          <div className={isNetBorrowApy}>
          {(optionDetails.trailing30DaysNetBorrowingAPY * 100).toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="px-2 pt-2 flex justify-between">
        <div className="w-4/12">
          <Title title="Debt Tokens" iconTitle />
          <div>
            <PopoverWrapper
              key={optionDetails.debt.token.name}
              title={
                <ImageWrapper
                  key={optionDetails.debt.token.name}
                  src={`/${optionDetails.debt.token.symbol.toLowerCase()}.png`}
                  alt={optionDetails.debt.token.symbol}
                  width={"20"}
                  height={"20"}
                  className="mr-1 rounded-full"
                />
              }
              content={
                <div className="text-xs text-slate-800">
                  {getFormattedTokenAmount(
                    optionDetails.debt.token,
                    optionDetails.debt.amount
                  )}{" "}
                  {optionDetails.debt.token.symbol}
                </div>
              }
            />
          </div>
        </div>
        <div className="flex w-8/12 justify-between">
          <div>
            <Title title="Max Debt Amount" />
            <div className="text-sm">{USDollar.format(optionDetails.maxDebtAmountInUSD)}</div>
          </div>
          <div className="flex flex-col">
            <PopoverWrapper
              title={<PopoverTitleWrapper title="Borrowing APY" />}
              content={
                <div>
                  <div className="text-xs text-slate-800">
                    {"Trailing 30 days Borrowing APY You Pay For Your Debt"}
                  </div>
                </div>
              }
            />
            <div className={isBorrowApy}>
              {(optionDetails.trailing30DaysBorrowingAPY * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
      <div className="px-2 pt-2 flex justify-between">
        <div className="w-4/12">
          <Title title="Collateral Tokens" iconTitle />
          <div>
            {optionDetails.collaterals.map((collateral) => (
              <PopoverWrapper
                key={collateral.token.name}
                title={
                  <ImageWrapper
                    key={collateral.token.name}
                    src={`/${collateral.token.symbol.toLowerCase()}.png`}
                    alt={collateral.token.symbol}
                    width={"20"}
                    height={"20"}
                    className="mr-1 rounded-full"
                  />
                }
                content={
                  <div className="text-xs text-slate-800">
                    {getFormattedTokenAmount(
                      collateral.token,
                      collateral.amount
                    )}{" "}
                    {collateral.token.symbol}
                  </div>
                }
              />
            ))}
          </div>
        </div>
        <div className="flex w-8/12 justify-between">
          <div>
            <Title title="Collateral Amount" />
            <div className="text-sm">
              {USDollar.format(optionDetails.totalCollateralAmountInUSD)}
            </div>
          </div>
          <div className="flex flex-col">
            <PopoverWrapper
              title={<PopoverTitleWrapper title="Collateral APY" />}
              content={
                <div>
                  <div className="text-xs text-slate-800">
                    {
                      "Trailing 30 Days Collateral APY For Collateral, Weighted Avg In Case of Multiple Collaterals"
                    }
                  </div>
                </div>
              }
            />
            <div className={isCollateralApy}>
              {(optionDetails.trailing30DaysLendingAPY * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
      <div className="px-2 pt-2 flex ">
        <div className="w-4/12">
          <Title title="Max LTV" />
          <div className={isMaxLTV}>{(optionDetails.maxLTV * 100).toFixed(2)}</div>
        </div>
        <div className="flex flex-col w-8/12">
          <PopoverWrapper
            title={<PopoverTitleWrapper title="Reward APY" />}
            content={
              <div>
                <div className="text-xs text-slate-800">
                  {
                    "Trailing 30 Days Reward APY For Reward, Weighted Avg In Case of Multiple Reward"
                  }
                </div>
              </div>
            }
          />
          <div className={isRewardApy}>{(optionDetails.trailing30DaysRewardAPY * 100).toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
};

export default BorrowCard;
