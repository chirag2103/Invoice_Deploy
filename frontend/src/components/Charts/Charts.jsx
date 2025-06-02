import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

const Charts = () => {
  const [chartData, setChartData] = React.useState({
    revenueData: {
      labels: [],
      datasets: [],
    },
    documentStats: {
      labels: [],
      datasets: [],
    },
    statusStats: {
      labels: [],
      datasets: [],
    },
  });

  React.useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/dashboard/charts');
      const data = await response.json();
      const { revenueData, documentStats, statusStats } = data;

      setChartData({
        revenueData: {
          labels: revenueData.labels,
          datasets: [
            {
              label: 'Revenue',
              data: revenueData.data,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        },
        documentStats: {
          labels: ['Invoices', 'Quotations', 'Challans'],
          datasets: [
            {
              label: 'Document Count',
              data: [
                documentStats.invoices,
                documentStats.quotations,
                documentStats.challans,
              ],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
              ],
            },
          ],
        },
        statusStats: {
          labels: ['Paid', 'Pending', 'Overdue'],
          datasets: [
            {
              data: [
                statusStats.paid,
                statusStats.pending,
                statusStats.overdue,
              ],
              backgroundColor: [
                'rgba(75, 192, 192, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(255, 99, 132, 0.5)',
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-white p-4 rounded-lg shadow'>
          <Bar
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Document Statistics' },
              },
            }}
            data={chartData.documentStats}
          />
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <Doughnut
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Payment Status' },
              },
            }}
            data={chartData.statusStats}
          />
        </div>
      </div>
    </div>
  );
};

export default Charts;
