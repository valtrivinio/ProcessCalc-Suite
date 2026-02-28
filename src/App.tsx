/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './modules/Dashboard';
import FluidProperties from './modules/FluidProperties';
import PipeSizing from './modules/PipeSizing';
import UnitConverter from './modules/UnitConverter';
import PumpSizing from './modules/PumpSizing';
import HeatTransfer from './modules/HeatTransfer';
import Compressor from './modules/Compressor';
import VesselSizing from './modules/VesselSizing';
import Valves from './modules/Valves';
import ReliefValve from './modules/ReliefValve';
import Utilities from './modules/Utilities';
import Settings from './modules/Settings';
import Validation from './modules/Validation';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fluid-properties" element={<FluidProperties />} />
            <Route path="/pipe-sizing" element={<PipeSizing />} />
            <Route path="/converter" element={<UnitConverter />} />
            <Route path="/pump-sizing" element={<PumpSizing />} />
            <Route path="/heat-transfer" element={<HeatTransfer />} />
            <Route path="/compressor" element={<Compressor />} />
            <Route path="/vessel-sizing" element={<VesselSizing />} />
            <Route path="/valves" element={<Valves />} />
            <Route path="/relief-valve" element={<ReliefValve />} />
            <Route path="/utilities" element={<Utilities />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </SettingsProvider>
  );
}
