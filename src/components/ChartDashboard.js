import React from "react";
import { Pie } from "react-chartjs-2";

export default function ChartDashboard({ expenses }) {
  const grouped = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const data = {
    labels: Object.keys(grouped),
    datasets: [
      {
        data: Object.values(grouped),
        backgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCE56",
          "#8E44AD",
          "#27AE60",
        ],
      },
    ],
  };

  return <Pie data={data} />;
}
