import { useState } from 'react';
import { apiFetch } from '../../../shared/api';
import type { Shipment } from '../../../shared/types';

export const shipmentFailurePresets = [
  'Customer unavailable',
  'Bad address',
  'Damaged package',
  'Carrier issue',
];

export function getShipmentStatusBadgeClass(status: Shipment['status']): string {
  switch (status) {
    case 'DELIVERED':
      return 'text-bg-success';
    case 'IN_TRANSIT':
      return 'text-bg-info';
    case 'FAILED':
      return 'text-bg-danger';
    default:
      return 'text-bg-secondary';
  }
}

export function getLatestShipmentNote(shipment: Shipment): string {
  return shipment.events[shipment.events.length - 1]?.note ?? '-';
}

export function getShipmentActions(
  status: Shipment['status'],
): Array<{ label: string; nextStatus: Shipment['status']; variant: string }> {
  switch (status) {
    case 'CREATED':
      return [
        { label: 'Mark In Transit', nextStatus: 'IN_TRANSIT', variant: 'btn-outline-info' },
        { label: 'Report Failure', nextStatus: 'FAILED', variant: 'btn-outline-danger' },
      ];
    case 'IN_TRANSIT':
      return [
        { label: 'Mark Delivered', nextStatus: 'DELIVERED', variant: 'btn-outline-success' },
        { label: 'Report Failure', nextStatus: 'FAILED', variant: 'btn-outline-danger' },
      ];
    case 'FAILED':
      return [
        { label: 'Reopen Shipment', nextStatus: 'CREATED', variant: 'btn-outline-secondary' },
      ];
    default:
      return [];
  }
}

export function useAdminShipments(
  token: string,
  onError: (message: string) => void,
  refreshShipments: () => Promise<void>,
) {
  const [shipmentFailureModal, setShipmentFailureModal] = useState<{
    orderId: string;
    preset: string;
    customNote: string;
  } | null>(null);

  async function handleUpdateShipmentStatus(
    orderId: string,
    status: Shipment['status'],
    note?: string,
  ) {
    onError('');

    try {
      await apiFetch<Shipment>(`/admin/shipments/${orderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          note: note?.trim() || undefined,
        }),
      });

      await refreshShipments();
    } catch (shipmentError) {
      onError(String(shipmentError));
    }
  }

  function openShipmentFailureModal(orderId: string): void {
    setShipmentFailureModal({
      orderId,
      preset: shipmentFailurePresets[0],
      customNote: '',
    });
  }

  function closeShipmentFailureModal(): void {
    setShipmentFailureModal(null);
  }

  function setShipmentFailurePreset(value: string): void {
    setShipmentFailureModal((current) =>
      current
        ? {
            ...current,
            preset: value,
          }
        : current,
    );
  }

  function setShipmentFailureCustomNote(value: string): void {
    setShipmentFailureModal((current) =>
      current
        ? {
            ...current,
            customNote: value,
          }
        : current,
    );
  }

  async function handleConfirmShipmentFailure(): Promise<void> {
    if (!shipmentFailureModal) {
      return;
    }

    const detail = shipmentFailureModal.customNote.trim();
    const note = detail
      ? `${shipmentFailureModal.preset}: ${detail}`
      : shipmentFailureModal.preset;

    await handleUpdateShipmentStatus(shipmentFailureModal.orderId, 'FAILED', note);
    closeShipmentFailureModal();
  }

  return {
    shipmentFailureModal,
    shipmentFailurePresets,
    getShipmentStatusBadgeClass,
    getLatestShipmentNote,
    getShipmentActions,
    openShipmentFailureModal,
    closeShipmentFailureModal,
    setShipmentFailurePreset,
    setShipmentFailureCustomNote,
    handleConfirmShipmentFailure,
    handleUpdateShipmentStatus,
  };
}
