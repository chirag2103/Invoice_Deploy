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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../utils/axios';

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

const defaultChartData = {
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
};

const Charts = () => {
  const [chartData, setChartData] = React.useState(defaultChartData);

  React.useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const data = response.data;

      setChartData({
        revenueData: {
          labels: [
            'Total Revenue',
            'Total Paid',
            'Total Pending',
            'Total Overdue',
          ],
          datasets: [
            {
              label: 'Amount (₹)',
              data: [
                data.totalRevenue,
                data.totalPaid,
                data.totalPending,
                data.totalOverdue,
              ],
              backgroundColor: [
                'rgba(75, 192, 192, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(255, 99, 132, 0.5)',
              ],
              borderColor: [
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(255, 99, 132)',
              ],
              borderWidth: 1,
            },
          ],
        },
        documentStats: {
          labels: ['Invoices', 'Quotations', 'Challans'],
          datasets: [
            {
              label: 'Document Count',
              data: [
                data.totalInvoices,
                data.totalQuotations,
                data.totalChallans,
              ],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
              ],
              borderColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
              ],
              borderWidth: 1,
            },
          ],
        },
        statusStats: {
          labels: ['Paid', 'Pending', 'Overdue'],
          datasets: [
            {
              data: [data.totalPaid, data.totalPending, data.totalOverdue],
              backgroundColor: [
                'rgba(75, 192, 192, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(255, 99, 132, 0.5)',
              ],
              borderColor: [
                'rgb(75, 192, 192)',
                'rgb(255, 206, 86)',
                'rgb(255, 99, 132)',
              ],
              borderWidth: 1,
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Document Statistics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Payment Status',
      },
    },
    cutout: '70%',
  };

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-white p-4 rounded-lg shadow'>
          <Bar options={barOptions} data={chartData.documentStats} />
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <Doughnut options={doughnutOptions} data={chartData.statusStats} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
