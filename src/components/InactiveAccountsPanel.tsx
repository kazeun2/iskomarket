import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  Shield,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { isExampleMode, filterExampleData } from "../utils/exampleMode";

interface InactiveAccountsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onSendWarning?: (username: string, message: string, inactiveDays: number) => void;
}

export function InactiveAccountsPanel({
  isOpen,
  onClose,
  currentUser,
}: InactiveAccountsPanelProps) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirmReactivate, setShowConfirmReactivate] =
    useState(false);
  const [showConfirmDelete, setShowConfirmDelete] =
    useState(false);
  const [showExtendGrace, setShowExtendGrace] = useState(false);
  const [extensionDays, setExtensionDays] = useState("30");

  // Mock inactive users data - only shown for example accounts
  const mockInactiveUsers = [
    {
      id: 1,
      username: "InactiveU1",
      email: "inactive1@cvsu.edu.ph",
      program: "BS Computer Science",
      inactiveDays: 35,
      status: "on-hold",
      lastActive: "2024-11-25",
      productsCount: 3,
      creditScore: 85,
    },
    {
      id: 2,
      username: "InactiveU2",
      email: "inactive2@cvsu.edu.ph",
      program: "BS Information Technology",
      inactiveDays: 60,
      status: "on-hold",
      lastActive: "2024-11-01",
      productsCount: 2,
      creditScore: 72,
    },
    {
      id: 3,
      username: "InactiveU3",
      email: "inactive3@cvsu.edu.ph",
      program: "BS Engineering",
      inactiveDays: 95,
      status: "pending-deletion",
      lastActive: "2024-09-27",
      productsCount: 5,
      creditScore: 68,
    },
    {
      id: 4,
      username: "ArchivedU1",
      email: "archived1@cvsu.edu.ph",
      program: "BS Biology",
      inactiveDays: 110,
      status: "archived",
      lastActive: "2024-09-12",
      productsCount: 1,
      creditScore: 45,
    },
  ];

  // Filter inactive users based on example mode
  const inactiveUsers = filterExampleData(mockInactiveUsers, currentUser);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-hold":
        return (
          <Badge
            className="rounded-[12px] text-white border-0"
            style={{
              background: '#FFF6CC',
              color: '#9A7A00',
              border: '1px solid #E2C45A',
              boxShadow: '0 0 6px rgba(226,196,90,0.3)'
            }}
          >
            On Hold
          </Badge>
        );
      case "pending-deletion":
        return (
          <Badge
            className="rounded-[12px] text-white border-0"
            style={{
              background: '#E87C22',
              boxShadow: '0 0 8px rgba(232,124,34,0.4)'
            }}
          >
            Pending Deletion
          </Badge>
        );
      case "archived":
        return (
          <Badge
            className="rounded-[12px] border-0"
            style={{
              background: 'rgba(100,100,100,0.2)',
              color: '#888',
              boxShadow: '0 0 6px rgba(100,100,100,0.2)'
            }}
          >
            Archived
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getDaysUntilDeletion = (inactiveDays: number) => {
    if (inactiveDays >= 100) {
      return Math.max(0, 130 - inactiveDays);
    } else if (inactiveDays >= 90) {
      return Math.max(0, 100 - inactiveDays);
    }
    return null;
  };

  const handleReactivate = (user: any) => {
    toast.success(
      `Account successfully reactivated for ${user.username}`,
    );
    setShowConfirmReactivate(false);
    setSelectedUser(null);
  };

  const handleDeletePermanently = (user: any) => {
    toast.success(
      `Account ${user.username} has been permanently deleted`,
    );
    setShowConfirmDelete(false);
    setSelectedUser(null);
  };

  const handleExtendGrace = (user: any) => {
    const days = parseInt(extensionDays);
    if (days > 0) {
      toast.success(
        `Grace period extended by ${days} days for ${user.username}`,
      );
      setShowExtendGrace(false);
      setSelectedUser(null);
      setExtensionDays("30");
    }
  };

  const onHoldUsers = inactiveUsers.filter(
    (u) => u.status === "on-hold",
  );
  const pendingDeletionUsers = inactiveUsers.filter(
    (u) => u.status === "pending-deletion",
  );
  const archivedUsers = inactiveUsers.filter(
    (u) => u.status === "archived",
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-4xl max-h-[90vh] rounded-[28px] bg-white border border-gray-200 shadow-xl text-gray-900"
        >
          <div className="absolute inset-0 rounded-[28px] -z-10 dark:block hidden"
            style={{
              background: 'rgba(8, 22, 18, 0.60)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 4px 22px rgba(0,255,180,0.12)'
            }}
          />
          <DialogHeader className="sticky top-0 z-50 pb-4 border-b border-[rgba(0,140,80,0.15)] dark:border-[rgba(0,255,180,0.08)]">
            <div className="flex justify-between items-start w-full">
              {/* Title on LEFT */}
              <DialogTitle className="flex items-center gap-2 text-[#0c5e35] dark:text-[#DFFFF4]">
                <UserX className="h-5 w-5 text-[#0c8f4a]" 
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(12,143,74,0.4))'
                  }}
                />
                Inactive Accounts Management
              </DialogTitle>

              {/* X button on RIGHT */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-[rgba(0,120,60,0.1)] dark:hover:bg-[rgba(0,255,140,0.1)]"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="on-hold" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 p-1 gap-2">
              <TabsTrigger 
                value="on-hold"
                className="relative transition-all duration-200 rounded-[18px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0c8f4a] data-[state=active]:to-[#067232] data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,255,150,0.35)] dark:data-[state=active]:shadow-[0_0_15px_rgba(0,255,130,0.35)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#3d7653] dark:data-[state=inactive]:text-[#7AD0A1] hover:scale-[1.02]"
              >
                On Hold ({onHoldUsers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="relative transition-all duration-200 rounded-[18px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0c8f4a] data-[state=active]:to-[#067232] data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,255,150,0.35)] dark:data-[state=active]:shadow-[0_0_15px_rgba(0,255,130,0.35)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#3d7653] dark:data-[state=inactive]:text-[#7AD0A1] hover:scale-[1.02]"
              >
                Pending Deletion ({pendingDeletionUsers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="archived"
                className="relative transition-all duration-200 rounded-[18px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0c8f4a] data-[state=active]:to-[#067232] data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,255,150,0.35)] dark:data-[state=active]:shadow-[0_0_15px_rgba(0,255,130,0.35)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#3d7653] dark:data-[state=inactive]:text-[#7AD0A1] hover:scale-[1.02]"
              >
                Archived ({archivedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="on-hold"
              className="space-y-3 max-h-[60vh] overflow-y-auto mt-4"
            >
              {onHoldUsers.map((user) => (
                <Card
                  key={user.id}
                  className="border-[1.5px] rounded-[16px] bg-white dark:bg-[rgba(14,26,22,0.45)] border-[rgba(226,196,90,0.4)] dark:border-[rgba(226,196,90,0.25)]"
                  style={{
                    boxShadow: '0 2px 8px rgba(226,196,90,0.12)'
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-yellow-400 transition-all hover:scale-105"
                        onClick={() =>
                          toast.info(
                            `Viewing profile for ${user.username}`,
                          )
                        }
                      >
                        <AvatarFallback className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          {user.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="cursor-pointer hover:text-[#0c8f4a] dark:hover:text-[#7AD0A1] hover:underline transition-colors text-[#064E33] dark:text-[#DFFFF4]"
                            onClick={() =>
                              toast.info(
                                `Viewing profile for ${user.username}`,
                              )
                            }
                          >
                            {user.username}
                          </p>
                          {getStatusBadge(user.status)}
                        </div>
                        <p
                          className="text-sm text-muted-foreground cursor-pointer hover:text-primary hover:underline transition-colors"
                          onClick={() =>
                            toast.info(`Email: ${user.email}`)
                          }
                        >
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.program}
                        </p>

                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {user.inactiveDays} days
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Products: {user.productsCount}
                          </div>
                          <div className="text-muted-foreground">
                            Score: {user.creditScore}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-[#0c8f4a] to-[#067232] text-white shadow-[0_0_8px_rgba(6,132,62,0.25)] hover:brightness-110 hover:translate-y-[-1px] transition-all"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowConfirmReactivate(true);
                          }}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Reactivate
                        </Button>
                        <Button
                          size="sm"
                          className="w-full border-[1.4px] border-[#067232] dark:border-[rgba(0,255,160,0.4)] hover:bg-[#E9F7EF] dark:hover:bg-[rgba(0,255,160,0.1)] text-[#067232] dark:text-[#8AD8B0] transition-all bg-transparent"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowExtendGrace(true);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Extend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent
              value="pending"
              className="space-y-3 max-h-[60vh] overflow-y-auto mt-4"
            >
              {pendingDeletionUsers.map((user) => {
                const daysLeft = getDaysUntilDeletion(
                  user.inactiveDays,
                );
                return (
                  <Card
                    key={user.id}
                    className="border-[1.5px] rounded-[16px] bg-white dark:bg-[rgba(14,26,22,0.45)] border-[rgba(232,124,34,0.4)] dark:border-[rgba(232,124,34,0.3)]"
                    style={{
                      boxShadow: '0 2px 8px rgba(232,124,34,0.15)'
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                            {user.username
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[#064E33] dark:text-[#DFFFF4]">
                              {user.username}
                            </p>
                            {getStatusBadge(user.status)}
                            {daysLeft !== null && (
                              <Badge
                                className="text-xs rounded-[10px] bg-gradient-to-r from-[#FF3030] to-[#D01010] text-white border-0"
                                style={{
                                  boxShadow: '0 0 8px rgba(255,48,48,0.35)'
                                }}
                              >
                                {daysLeft} days left
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#7FAF97] dark:text-[#A8EFD0]">
                            {user.email}
                          </p>
                          <p className="text-xs text-[#7FAF97] dark:text-[#A8EFD0]">
                            {user.program}
                          </p>

                          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                              <AlertTriangle className="h-3 w-3" />
                              <span>
                                {user.inactiveDays} days
                              </span>
                            </div>
                            <div className="text-[#7FAF97] dark:text-[#A8EFD0]">
                              Products: {user.productsCount}
                            </div>
                            <div className="text-[#7FAF97] dark:text-[#A8EFD0]">
                              Score: {user.creditScore}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-[#0c8f4a] to-[#067232] text-white shadow-[0_0_8px_rgba(6,132,62,0.25)] hover:brightness-110 hover:translate-y-[-1px] transition-all"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowConfirmReactivate(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Reactivate
                          </Button>
                          <Button
                            size="sm"
                            className="w-full border-[1.4px] border-[#067232] dark:border-[rgba(0,255,160,0.4)] hover:bg-[#E9F7EF] dark:hover:bg-[rgba(0,255,160,0.1)] text-[#067232] dark:text-[#8AD8B0] transition-all bg-transparent"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowExtendGrace(true);
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Extend
                          </Button>
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-[#FF3030] to-[#D01010] text-white shadow-[0_0_8px_rgba(255,48,48,0.35)] hover:brightness-110 transition-all"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowConfirmDelete(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent
              value="archived"
              className="space-y-3 max-h-[60vh] overflow-y-auto mt-4"
            >
              {archivedUsers.map((user) => {
                const daysLeft = getDaysUntilDeletion(
                  user.inactiveDays,
                );
                return (
                  <Card
                    key={user.id}
                    className="border-[1.5px] rounded-[16px] bg-white dark:bg-[rgba(14,26,22,0.45)] border-[rgba(120,120,120,0.3)] dark:border-[rgba(120,120,120,0.25)]"
                    style={{
                      boxShadow: '0 2px 8px rgba(100,100,100,0.1)'
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300">
                            {user.username
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[#064E33] dark:text-[#DFFFF4]">
                              {user.username}
                            </p>
                            {getStatusBadge(user.status)}
                            {daysLeft !== null && (
                              <Badge
                                className="text-xs rounded-[10px] bg-gradient-to-r from-[#FF3030] to-[#D01010] text-white border-0"
                                style={{
                                  boxShadow: '0 0 8px rgba(255,48,48,0.35)'
                                }}
                              >
                                {daysLeft} days until permanent
                                deletion
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#7FAF97] dark:text-[#A8EFD0]">
                            {user.email}
                          </p>
                          <p className="text-xs text-[#7FAF97] dark:text-[#A8EFD0]">
                            {user.program}
                          </p>

                          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <UserX className="h-3 w-3" />
                              <span>
                                {user.inactiveDays} days
                              </span>
                            </div>
                            <div className="text-[#7FAF97] dark:text-[#A8EFD0]">
                              Products: {user.productsCount}
                            </div>
                            <div className="text-[#7FAF97] dark:text-[#A8EFD0]">
                              Score: {user.creditScore}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-[#0c8f4a] to-[#067232] text-white shadow-[0_0_8px_rgba(6,132,62,0.25)] hover:brightness-110 hover:translate-y-[-1px] transition-all"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowConfirmReactivate(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-[#FF3030] to-[#D01010] text-white shadow-[0_0_8px_rgba(255,48,48,0.35)] hover:brightness-110 transition-all"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowConfirmDelete(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation */}
      <Dialog
        open={showConfirmReactivate}
        onOpenChange={setShowConfirmReactivate}
      >
        <DialogContent
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Confirm Reactivation
            </DialogTitle>
            <DialogDescription className="sr-only">Confirm reactivation of the selected user account and restore their products.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm">
              Are you sure you want to reactivate{" "}
              <strong>{selectedUser?.username}</strong>'s
              account?
            </p>

            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-xs text-green-800 dark:text-green-200">
                • Account will be set to Active
                <br />
                • All products will be restored
                <br />
                • Inactivity counter will be reset
                <br />• User will be notified via email
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmReactivate(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleReactivate(selectedUser)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Reactivate Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
      >
        <DialogContent
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Permanent Deletion
            </DialogTitle>
            <DialogDescription className="sr-only">Confirm permanent deletion of the selected account; this action cannot be undone.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm">
              Are you sure you want to{" "}
              <strong className="text-red-600">
                permanently delete
              </strong>{" "}
              {selectedUser?.username}'s account?
            </p>

            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-800 dark:text-red-200">
                <strong>
                  Warning: This action cannot be undone!
                </strong>
                <br />
                • All user data will be permanently deleted
                <br />
                • All products will be removed
                <br />
                • Transaction history will be archived
                <br />• User will be notified via email
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() =>
                  handleDeletePermanently(selectedUser)
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Grace Period */}
      <Dialog
        open={showExtendGrace}
        onOpenChange={setShowExtendGrace}
      >
        <DialogContent
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Extend Grace Period
            </DialogTitle>
            <DialogDescription className="sr-only">Extend the inactivity grace period for the selected account.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm">
              Extend the grace period for{" "}
              <strong>{selectedUser?.username}</strong>
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Extension Duration (days):
              </label>
              <Input
                type="number"
                min="1"
                max="90"
                value={extensionDays}
                onChange={(e) =>
                  setExtensionDays(e.target.value)
                }
                placeholder="Enter days to extend"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                • Current: {selectedUser?.inactiveDays} days
                inactive
                <br />• After extension:{" "}
                {Math.max(
                  0,
                  (selectedUser?.inactiveDays || 0) -
                    parseInt(extensionDays || "0"),
                )}{" "}
                days
                <br />• User will be notified of the extension
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowExtendGrace(false);
                  setExtensionDays("30");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleExtendGrace(selectedUser)}
                disabled={
                  !extensionDays || parseInt(extensionDays) <= 0
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Extend Grace Period
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}