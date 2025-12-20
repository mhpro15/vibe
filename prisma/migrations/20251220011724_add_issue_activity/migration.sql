-- CreateEnum
CREATE TYPE "IssueActivityType" AS ENUM ('ISSUE_CREATED', 'ISSUE_UPDATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNEE_CHANGED', 'COMMENT_ADDED', 'COMMENT_DELETED', 'SUBTASK_ADDED', 'SUBTASK_TOGGLED', 'SUBTASK_DELETED', 'LABEL_ADDED', 'LABEL_REMOVED');

-- CreateTable
CREATE TABLE "issue_activity" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "IssueActivityType" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "issue_activity" ADD CONSTRAINT "issue_activity_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_activity" ADD CONSTRAINT "issue_activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
