import useSWR from 'swr';
import type { ListJobsParams } from '../api';
import { listJobs } from '../api';

export function useJobs(params: ListJobsParams = {}) {
  const key = ['jobs', params];
  return useSWR(key, () => listJobs(params));
}
