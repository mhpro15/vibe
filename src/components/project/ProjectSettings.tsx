"use client";

import { GeneralSettings } from "./settings/GeneralSettings";
import { LabelSettings } from "./settings/LabelSettings";
import { StatusSettings } from "./settings/StatusSettings";
import { DangerZone } from "./settings/DangerZone";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface CustomStatus {
  id: string;
  name: string;
  color: string | null;
  position: number;
  wipLimit?: number | null;
}

interface ProjectSettingsProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    isArchived: boolean;
    labels: Label[];
    customStatuses: CustomStatus[];
  };
  canEdit: boolean;
}

export function ProjectSettings({ project, canEdit }: ProjectSettingsProps) {
  return (
    <div className="space-y-8">
      <GeneralSettings project={project} canEdit={canEdit} />
      <LabelSettings
        projectId={project.id}
        labels={project.labels}
        canEdit={canEdit}
      />
      <StatusSettings
        projectId={project.id}
        customStatuses={project.customStatuses}
        canEdit={canEdit}
      />
      <DangerZone project={project} canEdit={canEdit} />
    </div>
  );
}
