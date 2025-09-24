import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { guestsAPI } from '@/lib/api';
import { Calendar, MapPin, Clock, User, Plus, Minus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GuestPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const [guestName, setGuestName] = useState('');
  const [response, setResponse] = useState<'yes' | 'no' | null>(null);
  const [plusOnes, setPlusOnes] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [showPlusOnes, setShowPlusOnes] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['public-event', eventId],
    queryFn: () => guestsAPI.getPublicEvent(Number(eventId)).then(res => res.data),
    enabled: !!eventId,
  });

  // RSVP mutation - we'll create a simple guest entry
  const rsvpMutation = useMutation({
    mutationFn: ({ name, response, plus_ones }: { name: string; response: 'yes' | 'no'; plus_ones: string[] }) => {
      // For simplicity, we'll use the name as both name and email
      // In a real app, you might want to generate a unique identifier
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@guest.local`;
      return guestsAPI.rsvp(Number(eventId!), email, response, plus_ones);
    },
    onSuccess: () => {
      toast({
        title: "RSVP submitted!",
        description: "Thank you for your response.",
      });
      setResponse(response);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to submit RSVP',
        variant: "destructive",
      });
    },
  });

  const handleRSVP = async (responseType: 'yes' | 'no') => {
    if (!guestName.trim()) {
      setShowNameForm(true);
      return;
    }
    
    if (responseType === 'yes') {
      setHasAccepted(true);
      setShowPlusOnes(true);
      return;
    }
    
    // For decline, submit immediately
    setIsSubmitting(true);
    try {
      await rsvpMutation.mutateAsync({
        name: guestName,
        response: responseType,
        plus_ones: []
      });
      setResponse(responseType);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRSVP = async () => {
    setIsSubmitting(true);
    try {
      await rsvpMutation.mutateAsync({
        name: guestName,
        response: 'yes',
        plus_ones: plusOnes.filter(name => name.trim())
      });
      setResponse('yes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditName = () => {
    setHasAccepted(false);
    setShowPlusOnes(false);
  };

  const addPlusOne = () => {
    setPlusOnes([...plusOnes, '']);
  };

  const removePlusOne = (index: number) => {
    if (plusOnes.length > 1) {
      setPlusOnes(plusOnes.filter((_, i) => i !== index));
    }
  };

  const updatePlusOne = (index: number, value: string) => {
    const newPlusOnes = [...plusOnes];
    newPlusOnes[index] = value;
    setPlusOnes(newPlusOnes);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Evento Não Encontrado</h2>
            <p className="text-muted-foreground">
              O evento que você está procurando não existe ou foi removido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-8 max-w-2xl px-4">
        {/* Event Details */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold">{event.name}</CardTitle>
            <CardDescription className="text-base sm:text-lg">
              Organizado por {event.host_name}
            </CardDescription>
          </CardHeader>
          
          {/* Event Image */}
          {event.image_url && (
            <div className="px-6 pb-4">
              <div className="w-full h-48 sm:h-64 overflow-hidden rounded-lg">
                <img
                  src={event.image_url}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(new Date(event.date_time), 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.date_time), 'HH:mm', { locale: ptBR })} (Horário de Brasília)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p>{event.location}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <p>{event.event_type}</p>
              </div>
              
              {event.dress_code && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <p>Código de vestimenta: {event.dress_code}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RSVP Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">RSVP</CardTitle>
            <CardDescription>
              {response ? 'Obrigado pela sua resposta!' : 'Você participará deste evento?'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!response ? (
              <>
                {/* Name Input (always shown initially) */}
                {!hasAccepted && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Por favor, digite seu nome para responder
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="text-center"
                      />
                    </div>
                  </div>
                )}

                {/* Accept/Decline Buttons or Confirm/Edit Name */}
                {!hasAccepted ? (
                  <div className="space-y-4">
                    {!guestName.trim() && (
                      <div className="text-center">
                        <p className="text-sm text-amber-600 font-medium">
                          ↑ Digite seu nome acima para continuar
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <Button
                        onClick={() => handleRSVP('yes')}
                        disabled={isSubmitting || !guestName.trim()}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 sm:h-16 text-base sm:text-lg disabled:opacity-50"
                      >
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                        Aceitar
                      </Button>
                      <Button
                        onClick={() => handleRSVP('no')}
                        disabled={isSubmitting || !guestName.trim()}
                        variant="destructive"
                        className="flex-1 h-12 sm:h-16 text-base sm:text-lg disabled:opacity-50"
                      >
                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Você aceitou o convite como <strong>{guestName}</strong>
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        onClick={handleEditName}
                        variant="outline"
                        className="h-12 text-base sm:text-lg"
                      >
                        Editar Nome
                      </Button>
                    </div>
                  </div>
                )}

                {/* Plus Ones Section (shown when accepting) */}
                {hasAccepted && (
                  <div className="space-y-4 border-t pt-6">
                    <div className="text-center">
                      <h4 className="text-lg font-medium mb-2">Acompanhantes</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione os nomes dos acompanhantes que você trará
                      </p>
                    </div>
                    
                    {plusOnes.map((name, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={name}
                          onChange={(e) => updatePlusOne(index, e.target.value)}
                          placeholder={`Nome do acompanhante ${index + 1}`}
                          className="flex-1"
                        />
                        {plusOnes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removePlusOne(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPlusOne}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Outro Acompanhante
                    </Button>

                    {/* Final Confirmation Button */}
                    <div className="pt-6 border-t">
                      <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">
                          Pronto para confirmar sua presença?
                        </p>
                      </div>
                      <Button
                        onClick={handleSubmitRSVP}
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base sm:text-lg"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {isSubmitting ? 'Confirmando...' : 'Confirmar Presença'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-xl font-medium ${
                  response === 'yes' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {response === 'yes' ? (
                    <>
                      <CheckCircle className="h-6 w-6 mr-2" />
                      {guestName} está participando!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 mr-2" />
                      {guestName} recusou
                    </>
                  )}
                </div>
                
                {response === 'yes' && plusOnes.filter(name => name.trim()).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Seus Acompanhantes:</h4>
                    <ul className="space-y-1">
                      {plusOnes.filter(name => name.trim()).map((name, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                       <Button
                         variant="outline"
                         onClick={() => {
                           setResponse(null);
                           setGuestName('');
                           setPlusOnes(['']);
                           setShowPlusOnes(false);
                           setHasAccepted(false);
                         }}
                       >
                  Alterar Resposta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestPage;
