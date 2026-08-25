import { motion } from 'framer-motion';
import ContentSkeleton from './ContentSkeleton';

const StatsCards = ({ stats }) => {
  const cards = [
    { title: 'Total Feedback', value: stats.total || 0, color: 'bg-primary-500' },
    { title: 'Pending', value: stats.pending || 0, color: 'bg-warning' },
    { title: 'Under Review', value: stats.underreview || 0, color: 'bg-primary-600' },
    { title: 'Responded', value: stats.responded || 0, color: 'bg-success' },
  ];

  if (!stats || Object.keys(stats).length === 0) {
    return <ContentSkeleton variant="stat" count={4} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.06 }}
        >
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${card.color} mr-3`}></div>
            <div>
              <p className="text-secondary-600 text-sm">{card.title}</p>
              <p className="text-2xl font-bold text-secondary-900">{card.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;