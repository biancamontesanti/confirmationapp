import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { eventsAPI, guestsAPI } from '@/lib/api';
import { Event, Guest } from '@/lib/api';
import EventForm from '@/components/EventForm';
import GuestForm from '@/components/GuestForm';
import { Plus, LogOut, Calendar, Users, Download, Share2, Copy, Check, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'qrcode';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [guestFilter, setGuestFilter] = useState<'all' | 'yes' | 'no'>('all');

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsAPI.getAll().then(res => res.data),
  });

  // Fetch guests for selected event
  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['guests', selectedEvent?._id],
    queryFn: () => guestsAPI.getByEventId(selectedEvent!._id).then(res => res.data),
    enabled: !!selectedEvent,
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => eventsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedEvent(null);
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to delete event',
        variant: "destructive",
      });
    },
  });

  const handleDeleteEvent = (id: number) => {
    if (window.confirm('Tem certeza de que deseja excluir este evento?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const exportGuests = () => {
    if (!selectedEvent || filteredGuests.length === 0) return;

    const filterLabel = guestFilter === 'all' ? 'Todos' : 
                       guestFilter === 'yes' ? 'Confirmados' : 'Recusados';

    const csvContent = [
      ['Nome', 'Resposta', 'Acompanhantes', 'Respondeu em'],
      ...filteredGuests.map(guest => [
        guest.name,
        guest.response === 'yes' ? 'Confirmou' :
        guest.response === 'no' ? 'Recusou' : 'Pendente',
        JSON.parse(guest.plus_ones || '[]').join(', ') || 'Nenhum',
        guest.responded_at ? format(new Date(guest.responded_at), 'PPp', { locale: ptBR }) : 'Não respondeu'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEvent.name}-${filterLabel.toLowerCase()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getShareableLink = (eventId: number) => {
    return `${window.location.origin}/guest/${eventId}`;
  };

  const copyShareableLink = async (eventId: number) => {
    const link = getShareableLink(eventId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast({
        title: "Link copied!",
        description: "The shareable link has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      toast({
        title: "Link copied!",
        description: "The shareable link has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const generateQRCode = async (eventId: number) => {
    const link = getShareableLink(eventId);
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  // Guest statistics and filtering
  const confirmedGuests = guests.filter(guest => guest.response === 'yes');
  const declinedGuests = guests.filter(guest => guest.response === 'no');
  
  const totalConfirmed = confirmedGuests.reduce((total, guest) => {
    const plusOnes = JSON.parse(guest.plus_ones || '[]');
    return total + 1 + plusOnes.length;
  }, 0);
  
  const totalDeclined = declinedGuests.length;
  
  // Filter guests based on selected filter
  const filteredGuests = guests.filter(guest => {
    switch (guestFilter) {
      case 'yes': return guest.response === 'yes';
      case 'no': return guest.response === 'no';
      default: return true;
    }
  });

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="text-lg sm:text-xl font-semibold">Confirmation App</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <span className="sm:hidden text-sm text-muted-foreground">{user?.name?.split(' ')[0]}</span>
              <Button variant="outline" size="sm" onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Events List */}
          <div className="lg:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg font-semibold">Your Events</h2>
              <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Fill in the details for your event.
                    </DialogDescription>
                  </DialogHeader>
                  <EventForm
                    onSuccess={() => {
                      setShowEventForm(false);
                      queryClient.invalidateQueries({ queryKey: ['events'] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {eventsLoading ? (
                <div className="text-center py-4">Loading events...</div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No events yet. Create your first event!
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => (
                  <Card
                    key={event._id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedEvent?._id === event._id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="p-0">
                      {/* Event Image */}
                      {event.image_url && (
                        <div className="w-full h-32 sm:h-40 overflow-hidden rounded-t-lg">
                          <img
                            src={event.image_url}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{event.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.date_time), 'd \'de\' MMM \'de\' yyyy • HH:mm', { locale: ptBR })}
                            </p>
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyShareableLink(event._id);
                            }}
                            className="ml-2"
                            title={`Copy shareable link: ${getShareableLink(event._id)}`}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Event Details & Guests */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="space-y-6">
                {/* Event Details */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">{selectedEvent.name}</CardTitle>
                        <CardDescription>
                          Hosted by {selectedEvent.host_name}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingEvent(selectedEvent)}
                          className="w-full sm:w-auto"
                        >
                          Editar Evento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(selectedEvent._id)}
                          className="w-full sm:w-auto"
                        >
                          Excluir Evento
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Event Image */}
                  {selectedEvent.image_url && (
                    <div className="px-6 pb-4">
                      <div className="w-full h-48 sm:h-64 overflow-hidden rounded-lg">
                        <img
                          src={selectedEvent.image_url}
                          alt={selectedEvent.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Data e Horário:</span>
                        <p>{format(new Date(selectedEvent.date_time), 'EEEE, d \'de\' MMMM \'de\' yyyy • HH:mm', { locale: ptBR })} (Horário de Brasília)</p>
                      </div>
                      <div>
                        <span className="font-medium">Local:</span>
                        <p>{selectedEvent.location}</p>
                      </div>
                      <div>
                        <span className="font-medium">Tipo de Evento:</span>
                        <p>{selectedEvent.event_type}</p>
                      </div>
                      {selectedEvent.dress_code && (
                        <div>
                          <span className="font-medium">Código de Vestimenta:</span>
                          <p>{selectedEvent.dress_code}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Shareable Link */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Share2 className="h-5 w-5 mr-2" />
                      Share Event
                    </CardTitle>
                    <CardDescription>
                      Share this link with your guests so they can RSVP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <div className="flex-1 p-3 bg-muted rounded-md border min-w-0">
                          <code className="text-xs sm:text-sm break-all">
                            {getShareableLink(selectedEvent._id)}
                          </code>
                        </div>
                        <Button
                          onClick={() => copyShareableLink(selectedEvent._id)}
                          size="sm"
                          variant={copiedLink ? "default" : "outline"}
                          className="w-full sm:w-auto"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* QR Code Section */}
                      <div className="border-t pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                          <h4 className="text-sm font-medium">QR Code</h4>
                          <Button
                            onClick={() => generateQRCode(selectedEvent._id)}
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate QR
                          </Button>
                        </div>
                        {qrCodeUrl && (
                          <div className="flex flex-col items-center space-y-2">
                            <img 
                              src={qrCodeUrl} 
                              alt="QR Code for event" 
                              className="border rounded-lg"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                              Guests can scan this QR code to access the RSVP page
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>💡 <strong>Tip:</strong> Send this link to your guests via email, text, or social media.</p>
                        <p>Guests can click the link to view event details and RSVP without creating an account.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Guest Management */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Lista de Convidados
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span><strong>{guests.length}</strong> total</span>
                            <span className="text-green-600"><strong>{confirmedGuests.length}</strong> confirmaram ({totalConfirmed} pessoas)</span>
                            <span className="text-red-600"><strong>{totalDeclined}</strong> recusaram</span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-3">
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={guestFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setGuestFilter('all')}
                            className="text-xs"
                          >
                            Todos ({guests.length})
                          </Button>
                          <Button
                            variant={guestFilter === 'yes' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setGuestFilter('yes')}
                            className="text-xs text-green-700 hover:text-green-800"
                          >
                            Confirmaram ({confirmedGuests.length})
                          </Button>
                          <Button
                            variant={guestFilter === 'no' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setGuestFilter('no')}
                            className="text-xs text-red-700 hover:text-red-800"
                          >
                            Recusaram ({totalDeclined})
                          </Button>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportGuests}
                            disabled={filteredGuests.length === 0}
                            className="w-full sm:w-auto"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar {guestFilter === 'all' ? 'Todos' : 
                                    guestFilter === 'yes' ? 'Confirmados' : 'Recusados'}
                          </Button>
                          <Dialog open={showGuestForm} onOpenChange={setShowGuestForm}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Convidado
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Adicionar Convidado</DialogTitle>
                              <DialogDescription>
                                Adicione um convidado a este evento.
                              </DialogDescription>
                            </DialogHeader>
                            <GuestForm
                              eventId={selectedEvent._id}
                              onSuccess={() => {
                                setShowGuestForm(false);
                                queryClient.invalidateQueries({ queryKey: ['guests', selectedEvent._id] });
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {guestsLoading ? (
                      <div className="text-center py-4">Carregando convidados...</div>
                    ) : guests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum convidado ainda. Adicione alguns convidados para começar!
                      </div>
                    ) : filteredGuests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum convidado encontrado para o filtro "{
                          guestFilter === 'yes' ? 'Confirmaram' :
                          guestFilter === 'no' ? 'Recusaram' : 'Todos'
                        }".
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">Nome</TableHead>
                              <TableHead className="min-w-[100px]">Resposta</TableHead>
                              <TableHead className="min-w-[150px]">Acompanhantes</TableHead>
                              <TableHead className="min-w-[120px]">Respondeu</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {filteredGuests.map((guest) => {
                            const plusOnes = JSON.parse(guest.plus_ones || '[]');
                            return (
                              <TableRow key={guest._id}>
                                <TableCell className="font-medium">{guest.name}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    guest.response === 'yes' 
                                      ? 'bg-green-100 text-green-800' 
                                      : guest.response === 'no'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {guest.response === 'yes' ? '✅ Confirmou' : 
                                     guest.response === 'no' ? '❌ Recusou' : '⏳ Pendente'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {plusOnes.length > 0 ? (
                                    <div className="text-sm">
                                      {plusOnes.map((name: string, index: number) => (
                                        <div key={index}>+ {name}</div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Nenhum</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {guest.responded_at ? (
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(guest.responded_at), 'd \'de\' MMM, HH:mm', { locale: ptBR })}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">Não respondeu</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select an Event</h3>
                  <p className="text-muted-foreground">
                    Choose an event from the list to view details and manage guests.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Edit Event Dialog */}
        <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Evento</DialogTitle>
              <DialogDescription>
                Atualize os detalhes do seu evento.
              </DialogDescription>
            </DialogHeader>
            <EventForm
              event={editingEvent}
              onSuccess={async () => {
                setEditingEvent(null);
                await queryClient.invalidateQueries({ queryKey: ['events'] });
                
                // Update selected event if it's the one being edited
                if (selectedEvent && editingEvent && selectedEvent._id === editingEvent._id) {
                  // Find the updated event from the fresh data
                  const updatedEvents = await queryClient.getQueryData(['events']) as Event[];
                  const updatedEvent = updatedEvents?.find(e => e._id === editingEvent._id);
                  if (updatedEvent) {
                    setSelectedEvent(updatedEvent);
                  }
                }
                
                toast({
                  title: "Evento atualizado",
                  description: "Seu evento foi atualizado com sucesso.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DashboardPage;
