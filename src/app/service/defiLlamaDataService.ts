import { getDefiLlamaLendBorrowDataApi } from "../constants";

/**
 * Calculate the 30 day trailing borrowing and lending APYs for given lending pool.
 * This function fetches last 30 days of historical lend and borrow APYs from DefiLlama API
 * and calculates the trailing APYs.
 * @param poolId DefiLlama pool id of the lending pool
 * @returns
 */
export async function calculate30DayTrailingBorrowingAndLendingAPYs(
  poolId: string
): Promise<{
  trailingDayBorrowingAPY: number;
  trailingDayLendingAPY: number;
}> {
  return getHistoricalLendBorrowAPY(poolId, 30)
    .then((data) => {
      let cumulativeBorrowRate = 0;
      let cumulativeLendRate = 0;
      for (let i = 0; i < data.length; i++) {
        // expected shape of data:
        // { apyBase: number, apyReward: number, apyBaseBorrow: number, apyRewardBorrow: number }
        const datum: any = data[i];
        cumulativeBorrowRate += datum.apyBaseBorrow;
        cumulativeLendRate += datum.apyBase;
      }

      const trailingDayBorrowingAPY = cumulativeBorrowRate / data.length / 100;
      const trailingDayLendingAPY = cumulativeLendRate / data.length / 100;

      // console.log(
      //   `Cumulative borrow rate: ${cumulativeBorrowRate}, Cumulative lend rate: ${cumulativeLendRate}`
      // );
      // console.log(
      //   `Trailing day borrow rate: ${trailingDayBorrowingAPY}, Trailing day lend rate: ${trailingDayLendingAPY}`
      // );

      return { trailingDayBorrowingAPY, trailingDayLendingAPY };
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

// function to fetch historical lend & borrow apy for lending pool
export async function getHistoricalLendBorrowAPY(
  poolId: string,
  days: number = 30
): Promise<any[]> {
  try {
    const responseRaw = await fetch(getDefiLlamaLendBorrowDataApi(poolId));
    const response = await responseRaw.json();

    // return last 30 items from the array
    // console.log("Data length: ", response.data.length);
    const data = response.data.slice(-days);
    // console.dir(data, { depth: null });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
