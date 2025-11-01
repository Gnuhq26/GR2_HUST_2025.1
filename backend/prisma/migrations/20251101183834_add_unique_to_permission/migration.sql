/*
  Warnings:

  - A unique constraint covering the columns `[Action,Subject]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Permission_Action_Subject_key` ON `Permission`(`Action`, `Subject`);
