import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export { default as BarChart } from './BarChart';
export { default as DoughnutChart } from './DoughnutChart';
export { default as Charts } from './Charts';

const BarChart = ({
  data_1,
  data_2,
  title_1,
  title_2,
  bgColor_1,
  bgColor_2,
}) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Events & Count',
      },
    },
  };

  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: title_1,
        data: data_1,
        backgroundColor: bgColor_1,
      },
      {
        label: title_2,
        data: data_2,
        backgroundColor: bgColor_2,
      },
    ],
  };

  return <Bar options={options} data={data} />;
};

const DoughnutChart = ({ labels, data, backgroundColor, cutout }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    cutout,
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderWidth: 0,
      },
    ],
  };

  return <Doughnut data={chartData} options={options} />;
};

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
