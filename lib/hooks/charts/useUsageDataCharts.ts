import { useUsageData } from "@/lib/hooks/api/useUsageData";
import { format } from "date-fns";

export let useUsageDataCharts = (startDate: Date, endDate: Date) => {
  let query = useUsageData(startDate, endDate);

  if (query.some((result) => result.isLoading || result.isError)) {
    return { data: [], loading: true };
  }

  let data = query.map((result) => result.data);

  let groupedData = data
    .flatMap((day) => day!.data)
    .reduce((acc, cur) => {
      let date = format(new Date(cur.aggregation_timestamp * 1000), "h:mm a");

      acc.push({
        date: date,
        context: cur.n_context_tokens_total,
        generated: cur.n_generated_tokens_total,
        requests: cur.n_requests,
      });

      return acc;
    }, [] as { [key: string]: any });

  let totalCountContext = Object.values(groupedData).reduce(
    (acc, cur) => acc + cur.context,
    0
  );

  let totalCountGenerated = Object.values(groupedData).reduce(
    (acc, cur) => acc + cur.generated,
    0
  );

  let totalCountRequests = Object.values(groupedData).reduce(
    (acc, cur) => acc + cur.requests,
    0
  );

  let chartData = [...Object.entries(groupedData)]
    .map(([date, snapshotCosts]) => {
      return {
        date,
        ...snapshotCosts,
      };
    })
    .sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  return {
    data: chartData,
    totalCountContext,
    totalCountGenerated,
    totalCountRequests,
    loading: false,
  };
};
