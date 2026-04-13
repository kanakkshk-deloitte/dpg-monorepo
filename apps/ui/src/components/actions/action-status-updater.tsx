import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNetworkConfig } from '@/hooks/use-network-config';
import { SchemaForm } from '@/components/forms/schema-form';
import { resolveRefs } from '@/engine/schema/resolve-schema';
import type { RJSFSchema } from '@rjsf/utils';
import type { Action } from '@/lib/action-api';

// Desktop: Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Mobile: Drawer
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { useUpdateActionStatus } from '@/hooks/use-actions';
import { toast } from 'sonner';

interface ActionStatusUpdaterProps {
  action: Action | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedStatus?: string;
}

const STATUS_FORM_ID = 'action-status-form';

// Valid status transitions based on current status
const getValidTransitions = (currentStatus: string): string[] => {
  const transitions: Record<string, string[]> = {
    created: ['accepted', 'rejected', 'cancelled'],
    pending: ['accepted', 'rejected', 'cancelled'],
    accepted: ['completed', 'cancelled'],
    rejected: [],
    completed: [],
    cancelled: [],
  };
  return transitions[currentStatus] ?? [];
};

const statusLabels: Record<string, string> = {
  accepted: 'Accept',
  rejected: 'Reject',
  completed: 'Complete',
  cancelled: 'Cancel',
};

export function ActionStatusUpdater({
  action,
  open,
  onOpenChange,
  suggestedStatus,
}: ActionStatusUpdaterProps) {
  const isMobile = useIsMobile();
  const { mutate: updateStatus, isPending } = useUpdateActionStatus();
  const { data: networkConfig } = useNetworkConfig(action?.source_item_network ?? null);

  const [status, setStatus] = React.useState(suggestedStatus ?? '');
  const [remarks, setRemarks] = React.useState('');
  const [eventPayload, setEventPayload] = React.useState<Record<string, unknown>>({});
  const [eventSchema, setEventSchema] = React.useState<RJSFSchema | null>(null);

  // Reset form when action changes or modal opens
  React.useEffect(() => {
    if (open && action) {
      setStatus(suggestedStatus ?? getValidTransitions(action.action_status)[0] ?? '');
      setRemarks('');
      setEventPayload({});
    }
  }, [open, action, suggestedStatus]);

  // Load event schema from network config
  React.useEffect(() => {
    if (!open || !action || !networkConfig) {
      setEventSchema(null);
      return;
    }

    // Find the action interaction in network config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actions = networkConfig.actions as Record<string, { description?: string; interactions?: Array<{ from_domain: string; to_domain: string; event_schema?: unknown }> }> | undefined;
    const actionConfig = actions?.[action.action_name];
    if (!actionConfig) {
      setEventSchema(null);
      return;
    }

    const interaction = actionConfig.interactions?.find(
      (i: { from_domain: string; to_domain: string }) =>
        i.from_domain === action.source_item_domain &&
        i.to_domain === action.target_item_domain
    );

    if (!interaction?.event_schema) {
      setEventSchema(null);
      return;
    }

    // Resolve schema refs if needed
    const schema = interaction.event_schema;
    if (schema && typeof schema === 'object' && '$ref' in schema && typeof schema.$ref === 'string') {
      resolveRefs(schema as RJSFSchema)
        .then(setEventSchema)
        .catch(() => setEventSchema(null));
    } else if (schema && typeof schema === 'object') {
      setEventSchema(schema as RJSFSchema);
    } else {
      setEventSchema(null);
    }
  }, [open, action, networkConfig]);

  if (!action) return null;

  const validTransitions = getValidTransitions(action.action_status);

  const handleSubmit = () => {
    if (!status) {
      toast.error('Please select a status');
      return;
    }

    updateStatus(
      {
        action_id: action.action_id,
        action_status: status,
        remarks: remarks || undefined,
        event_payload: Object.keys(eventPayload).length > 0 ? eventPayload : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Action ${statusLabels[status]?.toLowerCase() ?? status} successfully`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(`Failed to update status: ${error.message}`);
        },
      }
    );
  };

  const formContent = (
    <div className="space-y-4">
      {/* Status Selection */}
      <div className="space-y-2">
        <Label htmlFor="status">New Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {validTransitions.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks (Optional)</Label>
        <Input
          id="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add any notes about this status change..."
        />
      </div>

      {/* Dynamic Event Schema Form */}
      {eventSchema && (
        <div className="space-y-2">
          <Label>Additional Information</Label>
          <div className="border rounded-md p-4">
            <SchemaForm
              id={STATUS_FORM_ID}
              schema={eventSchema}
              hideSubmit
              onSubmit={setEventPayload}
            />
          </div>
        </div>
      )}
    </div>
  );

  const actionLabel = statusLabels[status] ?? 'Update';

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Update Action Status</DrawerTitle>
            <DrawerDescription>
              {action.action_name} from {action.source_item_domain} → {action.target_item_domain}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">{formContent}</div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={isPending || !status}>
              {isPending ? 'Updating...' : actionLabel}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Action Status</DialogTitle>
          <DialogDescription>
            {action.action_name} from {action.source_item_domain} → {action.target_item_domain}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{formContent}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !status}>
            {isPending ? 'Updating...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
