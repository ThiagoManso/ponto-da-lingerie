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

