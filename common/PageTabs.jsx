import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * Standardized tab interface for page sections with animations
 * 
 * @param {object} props Component props
 * @param {Array<{id: string, label: string, labelKey: string, icon: React.ComponentType, content: React.ReactNode}>} props.tabs 
 *   Array of tab configurations
 * @param {string} props.activeTab Current active tab ID
 * @param {Function} props.setActiveTab Function to set active tab
 * @param {string} props.className Additional CSS classes for container
 */
export default function PageTabs({
  tabs = [],
  activeTab,
  setActiveTab,
  className = ""
}) {
  const { t } = useLanguage();

  // Animation variants
  const tabContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab}
      className={className}
    >
      <TabsList className="mb-6">
        {tabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.icon && React.createElement(tab.icon, { className: "h-4 w-4 mr-2" })}
            {tab.labelKey ? t(tab.labelKey) : tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={tabContentVariants}
          >
            {tab.content}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  );
}