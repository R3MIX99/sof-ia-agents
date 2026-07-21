import type {
  Widget,
  WidgetInactivityBehavior,
  WidgetStatus,
} from "@/domain/entities/widget.entity";

export interface CreateWidgetInput {
  organizationId: string;
  name: string;
  description?: string | null;
  providerConfigId?: string | null;
  language?: string;
  createdBy: string;
}

export interface UpdateWidgetInput {
  name?: string;
  description?: string | null;
  providerConfigId?: string | null;
  language?: string;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  status?: WidgetStatus;
  persistConversationAcrossSessions?: boolean;
  maxMessagesPerSession?: number | null;
  inactivityBehavior?: WidgetInactivityBehavior;
  systemPrompt?: string | null;
}

export interface WidgetRepository {
  findById(id: string): Promise<Widget | null>;
  findByOrganizationId(organizationId: string): Promise<Widget[]>;
  create(input: CreateWidgetInput): Promise<Widget>;
  update(id: string, input: UpdateWidgetInput): Promise<Widget>;
  delete(id: string): Promise<void>;
}
