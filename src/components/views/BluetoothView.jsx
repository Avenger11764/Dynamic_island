import React from 'react';
import { motion } from 'framer-motion';
import { BluetoothDevices } from '../ui/BluetoothDevices';

/** Bluetooth quick connect tab of the expanded notch. */
export const BluetoothView = React.memo(() => (
  <motion.div
    key="bluetooth"
    className="w-full max-h-full overflow-y-auto custom-scrollbar select-none"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.16 }}
  >
    <BluetoothDevices />
  </motion.div>
));

export default BluetoothView;
