/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Branches } from './pages/Branches';
import { Transfers } from './pages/Transfers';
import { AbcCurve } from './pages/AbcCurve';
import { POS } from './pages/POS';
import { SeasonalityCalendar } from './pages/SeasonalityCalendar';
import { PricingSettings } from './pages/PricingSettings';
import { Routing } from './pages/Routing';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { Shipping } from './pages/Shipping';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'produtos':
        return <Products />;
      case 'filiais':
        return <Branches />;
      case 'transferencias':
        return <Transfers />;
      case 'curva-abc':
        return <AbcCurve />;
      case 'pdv':
        return <POS />;
      case 'sazonalidades':
        return <SeasonalityCalendar />;
      case 'precificacao':
        return <PricingSettings />;
      case 'roteirizacao':
        return <Routing />;
      case 'relatorios':
        return <Reports />;
      case 'expedicao':
        return <Shipping />;
      case 'configuracoes':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <InventoryProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </InventoryProvider>
  );
}

