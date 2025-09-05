import useSWR from 'swr';
import { getMonitoringStatus } from '../api';

export function useMonitoringStatus() {
  return useSWR('monitoring-status', () => getMonitoringStatus());
}
