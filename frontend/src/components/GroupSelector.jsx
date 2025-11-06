import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export const GroupSelector = ({ groups, activeGroupId, onSelectGroup, onCreateGroup, onUpdateGroup, onDeleteGroup }) => {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState(null);
  const [groupName, setGroupName] = useState('');

  const handleCreate = () => {
    if (groupName.trim()) {
      onCreateGroup(groupName.trim());
      setGroupName('');
      setCreateDialogOpen(false);
      setOpen(false);
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setCreateDialogOpen(true);
  };

  const handleUpdate = () => {
    if (groupName.trim() && editingGroup) {
      onUpdateGroup(editingGroup.id, groupName.trim());
      setGroupName('');
      setEditingGroup(null);
      setCreateDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (deleteConfirmGroup) {
      onDeleteGroup(deleteConfirmGroup.id);
      setDeleteConfirmGroup(null);
    }
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" className="gap-2">
            <Users className="w-5 h-5" />
            {activeGroup ? activeGroup.name : 'Выбрать группу'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Группы</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              onClick={() => {
                setEditingGroup(null);
                setGroupName('');
                setCreateDialogOpen(true);
              }}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Создать группу
            </Button>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Пока нет групп. Создайте первую!
                  </p>
                ) : (
                  groups.map((group) => (
                    <div
                      key={group.id}
                      className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
                        group.id === activeGroupId
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectGroup(group.id);
                          setOpen(false);
                        }}
                        className="flex-1 text-left font-medium"
                      >
                        {group.name}
                      </button>
                      
                      <Button
                        onClick={() => handleEdit(group)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => setDeleteConfirmGroup(group)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Редактировать группу' : 'Создать группу'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Название группы</Label>
              <Input
                id="groupName"
                placeholder="Например: Мама, Друзья, Команда"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    editingGroup ? handleUpdate() : handleCreate();
                  }
                }}
              />
            </div>
            <Button
              onClick={editingGroup ? handleUpdate : handleCreate}
              className="w-full"
              disabled={!groupName.trim()}
            >
              {editingGroup ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmGroup} onOpenChange={() => setDeleteConfirmGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить группу?</AlertDialogTitle>
            <AlertDialogDescription>
              Группа "{deleteConfirmGroup?.name}" и вся её история будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupSelector;