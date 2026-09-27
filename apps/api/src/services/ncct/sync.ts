import { AppError } from '@api/utils/errors';

export function assertNcctSyncDeviceActive(active: boolean) {
  if (!active) throw new AppError('This offline device has been deactivated', 'NCCT_SYNC_DEVICE_INACTIVE', 409);
}
