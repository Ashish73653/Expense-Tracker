import React, { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard({ expenses, user }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!expenses.length) return null;

    // Total spent
    const totalSpent = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount),
      0
    );

    // Category breakdown
    const categoryData = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    // Monthly spending
    const monthlyData = expenses.reduce((acc, exp) => {
      const month = new Date(exp.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      acc[month] = (acc[month] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    // Recent trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExpenses = expenses.filter(
      (exp) => new Date(exp.date) >= sevenDaysAgo
    );
    const recentTotal = recentExpenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount),
      0
    );

    // Average per transaction
    const avgTransaction = totalSpent / expenses.length;

    // Top spending category
    const topCategory = Object.entries(categoryData).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      totalSpent,
      categoryData,
      monthlyData,
      recentTotal,
      avgTransaction,
      topCategory,
      transactionCount: expenses.length,
    };
  }, [expenses]);

  // Enhanced prediction logic with multiple AI models
  const prediction = useMemo(() => {
    if (!analytics || Object.keys(analytics.monthlyData).length < 1)
      return null;

    const months = Object.keys(analytics.monthlyData).sort();
    const values = months.map((month) => analytics.monthlyData[month]);

    // For single month, use different prediction approach
    if (values.length === 1) {
      const currentSpending = values[0];

      // Predict based on current patterns and seasonal factors
      const currentMonth = new Date().getMonth();
      const seasonalMultiplier =
        currentMonth === 11 || currentMonth === 0
          ? 1.2 // Dec/Jan
          : currentMonth >= 5 && currentMonth <= 7
          ? 1.1 // Summer
          : 1.0;

      const basePrediction = currentSpending * seasonalMultiplier;

      return {
        nextMonth: Math.max(0, basePrediction),
        linear: basePrediction,
        movingAverage: currentSpending,
        trend: "stable",
        confidence: 70, // Lower confidence with less data
        volatility: 0,
        categoryPredictions: Object.entries(analytics.categoryData)
          .map(([category, amount]) => {
            const categoryPercentage = amount / analytics.totalSpent;
            return {
              category,
              predicted: basePrediction * categoryPercentage,
              percentage: categoryPercentage * 100,
            };
          })
          .sort((a, b) => b.predicted - a.predicted),
        seasonalFactor: seasonalMultiplier,
      };
    }

    // Simple linear regression for trend
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextMonthLinear = slope * n + intercept;

    // Moving average prediction
    const recentValues = values.slice(-3); // Last 3 months
    const movingAverage =
      recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;

    // Seasonal adjustment
    const currentMonth = new Date().getMonth();
    const seasonalMultiplier =
      currentMonth === 11 || currentMonth === 0
        ? 1.2 // Dec/Jan
        : currentMonth >= 5 && currentMonth <= 7
        ? 1.1 // Summer
        : 1.0;

    // Weighted prediction
    const weightedPrediction =
      (nextMonthLinear * 0.6 + movingAverage * 0.4) * seasonalMultiplier;

    const trend =
      slope > 5 ? "increasing" : slope < -5 ? "decreasing" : "stable";
    const volatility =
      values.reduce((sum, val, i) => {
        const expected = intercept + slope * i;
        return sum + Math.pow(val - expected, 2);
      }, 0) / n;

    // Category predictions
    const categoryPredictions = Object.entries(analytics.categoryData)
      .map(([category, amount]) => {
        const categoryPercentage = amount / analytics.totalSpent;
        return {
          category,
          predicted: weightedPrediction * categoryPercentage,
          percentage: categoryPercentage * 100,
        };
      })
      .sort((a, b) => b.predicted - a.predicted);

    return {
      nextMonth: Math.max(0, weightedPrediction),
      linear: Math.max(0, nextMonthLinear),
      movingAverage,
      trend,
      confidence: Math.min(95, Math.max(50, 100 - Math.sqrt(volatility))),
      volatility: Math.sqrt(volatility),
      categoryPredictions,
      seasonalFactor: seasonalMultiplier,
    };
  }, [analytics]);

  // Budget tracking logic
  const budgetAnalysis = useMemo(() => {
    if (!analytics) return null;

    // Default budget based on average spending with 10% buffer
    const months = Object.keys(analytics.monthlyData);
    const avgMonthly = analytics.totalSpent / months.length;
    const suggestedBudget = avgMonthly * 1.1;

    // Current month spending
    const currentMonth = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    const currentMonthSpending = analytics.monthlyData[currentMonth] || 0;

    // Budget categories
    const categoryBudgets = Object.entries(analytics.categoryData).map(
      ([category, amount]) => {
        const avgCategorySpending = amount / months.length;
        const suggestedCategoryBudget = avgCategorySpending * 1.1;
        const currentCategorySpending = expenses
          .filter(
            (exp) =>
              exp.category === category &&
              new Date(exp.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              }) === currentMonth
          )
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        return {
          category,
          suggested: suggestedCategoryBudget,
          current: currentCategorySpending,
          percentage: (currentCategorySpending / suggestedCategoryBudget) * 100,
          status:
            currentCategorySpending > suggestedCategoryBudget
              ? "over"
              : currentCategorySpending > suggestedCategoryBudget * 0.8
              ? "warning"
              : "good",
        };
      }
    );

    return {
      totalSuggested: suggestedBudget,
      totalCurrent: currentMonthSpending,
      totalPercentage: (currentMonthSpending / suggestedBudget) * 100,
      categoryBudgets,
      daysInMonth: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate(),
      currentDay: new Date().getDate(),
    };
  }, [analytics, expenses]);

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("Expense Report", 20, 20);

    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

    if (analytics) {
      // Add summary information
      doc.setFontSize(14);
      doc.text("Summary", 20, 50);

      const summaryData = [
        ["Total Spent", `$${analytics.totalSpent.toFixed(2)}`],
        ["Total Transactions", analytics.transactionCount.toString()],
        ["Average Transaction", `$${analytics.avgTransaction.toFixed(2)}`],
        ["Recent 7 Days", `$${analytics.recentTotal.toFixed(2)}`],
      ];

      autoTable(doc, {
        startY: 55,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
      });

      // Add category breakdown
      doc.text("Category Breakdown", 20, doc.lastAutoTable.finalY + 20);

      const categoryData = Object.entries(analytics.categoryData).map(
        ([category, amount]) => [
          category,
          `$${amount.toFixed(2)}`,
          `${((amount / analytics.totalSpent) * 100).toFixed(1)}%`,
        ]
      );

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["Category", "Amount", "Percentage"]],
        body: categoryData,
        theme: "grid",
      });

      // Add monthly breakdown
      doc.text("Monthly Breakdown", 20, doc.lastAutoTable.finalY + 20);

      const monthlyData = Object.entries(analytics.monthlyData).map(
        ([month, amount]) => [month, `$${amount.toFixed(2)}`]
      );

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["Month", "Amount"]],
        body: monthlyData,
        theme: "grid",
      });
    }

    // Save the PDF
    doc.save(`expense-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportToExcel = () => {
    if (!analytics) {
      alert("No data to export");
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary worksheet
    const summaryData = [
      ["Metric", "Value"],
      ["Total Spent", analytics.totalSpent.toFixed(2)],
      ["Total Transactions", analytics.transactionCount],
      ["Average Transaction", analytics.avgTransaction.toFixed(2)],
      ["Recent 7 Days", analytics.recentTotal.toFixed(2)],
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    // Category breakdown worksheet
    const categoryData = [
      ["Category", "Amount", "Percentage"],
      ...Object.entries(analytics.categoryData).map(([category, amount]) => [
        category,
        amount.toFixed(2),
        ((amount / analytics.totalSpent) * 100).toFixed(1) + "%",
      ]),
    ];

    const categoryWS = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categoryWS, "Categories");

    // Monthly breakdown worksheet
    const monthlyData = [
      ["Month", "Amount"],
      ...Object.entries(analytics.monthlyData).map(([month, amount]) => [
        month,
        amount.toFixed(2),
      ]),
    ];

    const monthlyWS = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlyWS, "Monthly");

    // Export predictions if available
    if (prediction) {
      const predictionData = [
        ["Metric", "Value"],
        ["Next Month Prediction", prediction.nextMonth.toFixed(2)],
        ["Trend", prediction.trend],
        ["Confidence", prediction.confidence.toFixed(1) + "%"],
        ["Seasonal Factor", prediction.seasonalFactor.toFixed(2)],
      ];

      const predictionWS = XLSX.utils.aoa_to_sheet(predictionData);
      XLSX.utils.book_append_sheet(wb, predictionWS, "Predictions");
    }

    // Save the file
    XLSX.writeFile(
      wb,
      `expense-report-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const generateChartReport = async () => {
    if (!analytics) {
      alert("No data to generate chart report");
      return;
    }

    try {
      // Create a temporary container for charts
      const chartContainer = document.createElement("div");
      chartContainer.style.position = "absolute";
      chartContainer.style.top = "-9999px";
      chartContainer.style.width = "800px";
      chartContainer.style.height = "600px";
      chartContainer.style.backgroundColor = "white";
      document.body.appendChild(chartContainer);

      // Create canvas elements for charts
      const createChart = (canvasId, chartConfig) => {
        const canvas = document.createElement("canvas");
        canvas.id = canvasId;
        canvas.width = 400;
        canvas.height = 300;
        chartContainer.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        return new ChartJS(ctx, chartConfig);
      };

      // Category chart
      const categoryChart = createChart("categoryChart", {
        type: "doughnut",
        data: {
          labels: Object.keys(analytics.categoryData),
          datasets: [
            {
              data: Object.values(analytics.categoryData),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
              ],
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: "Spending by Category",
            },
          },
        },
      });

      // Monthly chart
      const monthlyChart = createChart("monthlyChart", {
        type: "line",
        data: {
          labels: Object.keys(analytics.monthlyData),
          datasets: [
            {
              label: "Monthly Spending",
              data: Object.values(analytics.monthlyData),
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.1)",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: "Monthly Spending Trend",
            },
          },
        },
      });

      // Wait for charts to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture the charts as image
      const canvas = await html2canvas(chartContainer, {
        backgroundColor: "white",
        scale: 2,
      });

      // Clean up
      categoryChart.destroy();
      monthlyChart.destroy();
      document.body.removeChild(chartContainer);

      // Create PDF with chart
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Expense Charts Report", 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

      // Add the chart image
      doc.addImage(imgData, "PNG", 10, 45, 190, 120);

      // Add summary table
      if (analytics) {
        const summaryData = [
          ["Total Spent", `$${analytics.totalSpent.toFixed(2)}`],
          ["Total Transactions", analytics.transactionCount.toString()],
          ["Average Transaction", `$${analytics.avgTransaction.toFixed(2)}`],
        ];

        autoTable(doc, {
          startY: 175,
          head: [["Metric", "Value"]],
          body: summaryData,
          theme: "grid",
        });
      }

      doc.save(`expense-charts-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating chart report:", error);
      alert("Error generating chart report. Please try again.");
    }
  };

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "analytics", label: "📈 Analytics" },
    { id: "categories", label: "🏷️ Categories" },
    { id: "predictions", label: "🔮 AI Predictions" },
    { id: "budget", label: "💰 Budget Tracker" },
    { id: "reports", label: "📄 Reports" },
    { id: "insights", label: "💡 Smart Insights" },
  ];

  const renderTabContent = () => {
    if (!analytics) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>📊</div>
          <h3>No Data Available</h3>
          <p>Add some expenses to see analytics and insights!</p>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                  ${analytics.totalSpent.toFixed(2)}
                </div>
                <div style={{ opacity: 0.9, fontSize: "14px" }}>
                  Total Spent
                </div>
              </div>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                  {analytics.transactionCount}
                </div>
                <div style={{ opacity: 0.9, fontSize: "14px" }}>
                  Transactions
                </div>
              </div>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "white",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                  ${analytics.avgTransaction.toFixed(2)}
                </div>
                <div style={{ opacity: 0.9, fontSize: "14px" }}>
                  Avg per Transaction
                </div>
              </div>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                  color: "white",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                  ${analytics.recentTotal.toFixed(2)}
                </div>
                <div style={{ opacity: 0.9, fontSize: "14px" }}>
                  Last 7 Days
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                  Monthly Spending Trend
                </h4>
                <div style={{ height: "250px" }}>
                  <Line
                    data={{
                      labels: Object.keys(analytics.monthlyData),
                      datasets: [
                        {
                          label: "Monthly Spending",
                          data: Object.values(analytics.monthlyData),
                          borderColor: "rgb(75, 192, 192)",
                          backgroundColor: "rgba(75, 192, 192, 0.1)",
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return "$" + value;
                            },
                            font: {
                              size: 11,
                            },
                          },
                        },
                        x: {
                          ticks: {
                            font: {
                              size: 11,
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                  Top Spending Categories
                </h4>
                <div style={{ height: "250px" }}>
                  <Doughnut
                    data={{
                      labels: Object.keys(analytics.categoryData),
                      datasets: [
                        {
                          data: Object.values(analytics.categoryData),
                          backgroundColor: [
                            "#FF6384",
                            "#36A2EB",
                            "#FFCE56",
                            "#4BC0C0",
                            "#9966FF",
                            "#FF9F40",
                          ],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            font: {
                              size: 11,
                            },
                            padding: 10,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div>
            <div
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                Spending by Category
              </h4>
              <div style={{ height: "300px" }}>
                <Bar
                  data={{
                    labels: Object.keys(analytics.categoryData),
                    datasets: [
                      {
                        label: "Amount Spent",
                        data: Object.values(analytics.categoryData),
                        backgroundColor: "rgba(54, 162, 235, 0.6)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function (value) {
                            return "$" + value;
                          },
                          font: {
                            size: 11,
                          },
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 11,
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h4>Monthly Breakdown</h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "15px",
                }}
              >
                {Object.entries(analytics.monthlyData).map(
                  ([month, amount]) => (
                    <div
                      key={month}
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: "#007bff" }}>
                        {month}
                      </div>
                      <div style={{ fontSize: "18px", color: "#333" }}>
                        ${amount.toFixed(2)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "categories":
        return (
          <div>
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h4>Category Analysis</h4>
              <div style={{ display: "grid", gap: "15px" }}>
                {Object.entries(analytics.categoryData)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount], index) => {
                    const percentage = (
                      (amount / analytics.totalSpent) *
                      100
                    ).toFixed(1);
                    return (
                      <div
                        key={category}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "15px",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: [
                              "#FF6384",
                              "#36A2EB",
                              "#FFCE56",
                              "#4BC0C0",
                              "#9966FF",
                              "#FF9F40",
                            ][index % 6],
                            marginRight: "15px",
                          }}
                        ></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", color: "#333" }}>
                            {category}
                          </div>
                          <div style={{ color: "#666", fontSize: "14px" }}>
                            {percentage}% of total spending
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#007bff",
                          }}
                        >
                          ${amount.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );

      case "predictions":
        return (
          <div>
            {prediction ? (
              <div>
                <div
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "1px solid #e0e0e0",
                    marginBottom: "20px",
                  }}
                >
                  <h4>🔮 Next Month Prediction</h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "bold",
                          color: "#007bff",
                        }}
                      >
                        ${prediction.nextMonth.toFixed(2)}
                      </div>
                      <div style={{ color: "#666" }}>Predicted Spending</div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "bold",
                          color:
                            prediction.trend === "increasing"
                              ? "#dc3545"
                              : prediction.trend === "decreasing"
                              ? "#28a745"
                              : "#6c757d",
                        }}
                      >
                        {prediction.trend === "increasing"
                          ? "📈"
                          : prediction.trend === "decreasing"
                          ? "📉"
                          : "➡️"}
                      </div>
                      <div style={{ color: "#666" }}>
                        Trend: {prediction.trend}
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "bold",
                          color: "#17a2b8",
                        }}
                      >
                        {prediction.confidence.toFixed(0)}%
                      </div>
                      <div style={{ color: "#666" }}>Confidence</div>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <h4>📊 Prediction Insights</h4>
                  <div
                    style={{
                      padding: "15px",
                      background: "#e8f4fd",
                      borderRadius: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    <strong>💡 Based on your spending pattern:</strong>
                    <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
                      <li>
                        Your spending trend is{" "}
                        <strong>{prediction.trend}</strong>
                      </li>
                      <li>
                        Next month's estimated spending:{" "}
                        <strong>${prediction.nextMonth.toFixed(2)}</strong>
                      </li>
                      <li>
                        Prediction confidence:{" "}
                        <strong>{prediction.confidence.toFixed(0)}%</strong>
                      </li>
                    </ul>
                  </div>
                  {prediction.trend === "increasing" && (
                    <div
                      style={{
                        padding: "15px",
                        background: "#fff3cd",
                        borderRadius: "8px",
                        border: "1px solid #ffeaa7",
                      }}
                    >
                      <strong>⚠️ Spending Alert:</strong> Your expenses are
                      trending upward. Consider reviewing your budget!
                    </div>
                  )}
                  {prediction.trend === "decreasing" && (
                    <div
                      style={{
                        padding: "15px",
                        background: "#d4edda",
                        borderRadius: "8px",
                        border: "1px solid #c3e6cb",
                      }}
                    >
                      <strong>✅ Great Job:</strong> Your spending is trending
                      downward. Keep up the good work!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔮</div>
                <h3>Need More Data</h3>
                <p>
                  Add expenses from at least 2 different months to see
                  predictions!
                </p>
              </div>
            )}
          </div>
        );

      case "insights":
        return (
          <div>
            <div style={{ display: "grid", gap: "20px" }}>
              <div
                style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h4>💡 Smart Insights</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      borderLeft: "4px solid #007bff",
                    }}
                  >
                    <strong>🏆 Top Category:</strong> You spend most on{" "}
                    <strong>{analytics.topCategory?.[0]}</strong> ($
                    {analytics.topCategory?.[1]?.toFixed(2)})
                  </div>
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      borderLeft: "4px solid #28a745",
                    }}
                  >
                    <strong>💰 Average Transaction:</strong> You typically spend{" "}
                    <strong>${analytics.avgTransaction.toFixed(2)}</strong> per
                    transaction
                  </div>
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      borderLeft: "4px solid #ffc107",
                    }}
                  >
                    <strong>📅 Recent Activity:</strong> You've spent{" "}
                    <strong>${analytics.recentTotal.toFixed(2)}</strong> in the
                    last 7 days
                  </div>
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      borderLeft: "4px solid #dc3545",
                    }}
                  >
                    <strong>📊 Diversity:</strong> You track expenses across{" "}
                    <strong>
                      {Object.keys(analytics.categoryData).length}
                    </strong>{" "}
                    different categories
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h4>🎯 Recommendations</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  {analytics.recentTotal > analytics.avgTransaction * 3 && (
                    <div
                      style={{
                        padding: "15px",
                        background: "#fff3cd",
                        borderRadius: "8px",
                        border: "1px solid #ffeaa7",
                      }}
                    >
                      <strong>⚠️ High Recent Spending:</strong> You've been
                      spending more than usual recently. Consider reviewing your
                      budget.
                    </div>
                  )}
                  {Object.keys(analytics.categoryData).length < 3 && (
                    <div
                      style={{
                        padding: "15px",
                        background: "#e8f4fd",
                        borderRadius: "8px",
                        border: "1px solid #bee5eb",
                      }}
                    >
                      <strong>💡 Tip:</strong> Try categorizing your expenses
                      more specifically for better insights!
                    </div>
                  )}
                  <div
                    style={{
                      padding: "15px",
                      background: "#d4edda",
                      borderRadius: "8px",
                      border: "1px solid #c3e6cb",
                    }}
                  >
                    <strong>✨ Keep Going:</strong> You're doing great tracking
                    your expenses! Consistency is key to financial awareness.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "budget":
        return (
          <div>
            {budgetAnalysis ? (
              <div>
                {/* Budget Overview */}
                <div
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    marginBottom: "15px",
                  }}
                >
                  <h4 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>
                    💰 Monthly Budget Overview
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "15px",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        background: "#f0f8ff",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#007bff",
                        }}
                      >
                        ${budgetAnalysis.totalSuggested.toFixed(2)}
                      </div>
                      <div style={{ color: "#666", fontSize: "14px" }}>
                        Suggested Budget
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        background:
                          budgetAnalysis.totalPercentage > 100
                            ? "#fff3cd"
                            : "#d4edda",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color:
                            budgetAnalysis.totalPercentage > 100
                              ? "#856404"
                              : "#155724",
                        }}
                      >
                        ${budgetAnalysis.totalCurrent.toFixed(2)}
                      </div>
                      <div style={{ color: "#666", fontSize: "14px" }}>
                        Current Spending
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color:
                            budgetAnalysis.totalPercentage > 100
                              ? "#dc3545"
                              : "#28a745",
                        }}
                      >
                        {budgetAnalysis.totalPercentage.toFixed(1)}%
                      </div>
                      <div style={{ color: "#666", fontSize: "14px" }}>
                        Budget Used
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#6c757d",
                        }}
                      >
                        Day {budgetAnalysis.currentDay}/
                        {budgetAnalysis.daysInMonth}
                      </div>
                      <div style={{ color: "#666", fontSize: "14px" }}>
                        Month Progress
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Budgets */}
                <div
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <h4 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>
                    📊 Category Budget Tracking
                  </h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {budgetAnalysis.categoryBudgets.map((budget, index) => (
                      <div
                        key={budget.category}
                        style={{
                          padding: "15px",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          border: `3px solid ${
                            budget.status === "over"
                              ? "#dc3545"
                              : budget.status === "warning"
                              ? "#ffc107"
                              : "#28a745"
                          }`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>
                            {budget.category}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <span style={{ fontSize: "14px", color: "#666" }}>
                              ${budget.current.toFixed(2)} / $
                              {budget.suggested.toFixed(2)}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color:
                                  budget.status === "over"
                                    ? "#dc3545"
                                    : budget.status === "warning"
                                    ? "#856404"
                                    : "#155724",
                              }}
                            >
                              {budget.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            height: "8px",
                            background: "#e9ecef",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, budget.percentage)}%`,
                              background:
                                budget.status === "over"
                                  ? "#dc3545"
                                  : budget.status === "warning"
                                  ? "#ffc107"
                                  : "#28a745",
                              transition: "width 0.3s ease",
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>💰</div>
                <h3>Budget Tracker</h3>
                <p>Add some expenses to see budget analysis!</p>
              </div>
            )}
          </div>
        );

      case "reports":
        return (
          <div>
            <div style={{ display: "grid", gap: "15px" }}>
              {/* Quick Stats Report */}
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h4 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>
                  📄 Expense Summary Report
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#495057" }}>
                      Total Transactions
                    </div>
                    <div style={{ fontSize: "24px", color: "#007bff" }}>
                      {analytics?.transactionCount || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#495057" }}>
                      Average Transaction
                    </div>
                    <div style={{ fontSize: "24px", color: "#28a745" }}>
                      ${analytics?.avgTransaction.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#495057" }}>
                      Top Category
                    </div>
                    <div style={{ fontSize: "18px", color: "#6f42c1" }}>
                      {analytics?.topCategory?.[0] || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Report */}
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h4 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>
                  📅 Monthly Breakdown Report
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {analytics &&
                    Object.entries(analytics.monthlyData).map(
                      ([month, amount]) => (
                        <div
                          key={month}
                          style={{
                            textAlign: "center",
                            padding: "10px",
                            background: "#e8f4fd",
                            borderRadius: "6px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: "12px",
                              color: "#495057",
                            }}
                          >
                            {month}
                          </div>
                          <div style={{ fontSize: "16px", color: "#007bff" }}>
                            ${amount.toFixed(2)}
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>

              {/* Export Options */}
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h4 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>
                  📊 Export Options
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <button
                    onClick={exportToPDF}
                    style={{
                      padding: "15px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    📄 Export to PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    style={{
                      padding: "15px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    📊 Export to Excel
                  </button>
                  <button
                    onClick={generateChartReport}
                    style={{
                      padding: "15px",
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    📈 Generate Chart Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "20px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              border: "none",
              background: activeTab === tab.id ? "#007bff" : "transparent",
              color: activeTab === tab.id ? "white" : "#666",
              cursor: "pointer",
              borderRadius: "8px 8px 0 0",
              marginRight: "5px",
              fontSize: "14px",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: "300px" }}>{renderTabContent()}</div>
    </div>
  );
}
