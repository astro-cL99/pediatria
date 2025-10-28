import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ExternalLink, Calculator as CalcIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const pediatricCalculators = [
  {
    name: "APGAR Score",
    description: "Evaluación rápida del estado del recién nacido",
    url: "https://www.mdcalc.com/calc/3953/apgar-score",
    category: "Neonatología"
  },
  {
    name: "Pediatric Glasgow Coma Scale (pGCS)",
    description: "Escala de Glasgow para pacientes pediátricos",
    url: "https://www.mdcalc.com/calc/3702/pediatric-glasgow-coma-scale-pgcs",
    category: "Neurología"
  },
  {
    name: "Maintenance Fluids Calculations",
    description: "Cálculo de fluidos de mantenimiento pediátricos",
    url: "https://www.mdcalc.com/calc/72/maintenance-fluids-calculations",
    category: "Fluidos"
  },
  {
    name: "PECARN Pediatric Head Injury/Trauma Algorithm",
    description: "Algoritmo de trauma craneal pediátrico",
    url: "https://www.mdcalc.com/calc/589/pecarn-pediatric-head-injury-trauma-algorithm",
    category: "Trauma"
  },
  {
    name: "Pediatric Early Warning Score (PEWS)",
    description: "Sistema de alerta temprana pediátrica",
    url: "https://www.mdcalc.com/calc/3901/pediatric-early-warning-score-pews",
    category: "Cuidados Intensivos"
  },
  {
    name: "Pediatric Appendicitis Score (PAS)",
    description: "Puntaje para apendicitis pediátrica",
    url: "https://www.mdcalc.com/calc/3926/pediatric-appendicitis-score-pas",
    category: "Cirugía"
  },
  {
    name: "Pediatric Ins and Outs",
    description: "Balance de ingresos y egresos pediátricos",
    url: "https://www.mdcalc.com/calc/85/pediatric-ins-outs",
    category: "Fluidos"
  },
  {
    name: "AAP Pediatric Hypertension Guidelines",
    description: "Guías de hipertensión pediátrica AAP",
    url: "https://www.mdcalc.com/calc/4052/aap-pediatric-hypertension-guidelines",
    category: "Cardiología"
  },
  {
    name: "Pediatric Appendicitis Risk Calculator (pARC)",
    description: "Calculadora de riesgo de apendicitis pediátrica",
    url: "https://www.mdcalc.com/calc/10201/pediatric-appendicitis-risk-calculator-parc",
    category: "Cirugía"
  },
  {
    name: "BMI Percentile Calculator for Child and Teen",
    description: "Calculadora de percentil de IMC para niños y adolescentes",
    url: "https://www.mdcalc.com/calc/68/bmi-percentile-calculator-child-teen",
    category: "Nutrición"
  },
  {
    name: "Pediatric Respiratory Assessment Measure (PRAM)",
    description: "Medición de evaluación respiratoria pediátrica",
    url: "https://www.mdcalc.com/calc/3985/pediatric-respiratory-assessment-measure-pram-asthma-exacerbation-severity",
    category: "Respiratorio"
  },
  {
    name: "Centor Score (Modified/McIsaac)",
    description: "Puntaje para faringitis estreptocócica",
    url: "https://www.mdcalc.com/calc/104/centor-score-modified-mcisaac-strep-pharyngitis",
    category: "Infeccioso"
  },
  {
    name: "Pediatric Trauma Score",
    description: "Puntuación de trauma pediátrico",
    url: "https://www.mdcalc.com/calc/3928/pediatric-trauma-score",
    category: "Trauma"
  },
  {
    name: "Absolute Neutrophil Count (ANC)",
    description: "Recuento absoluto de neutrófilos",
    url: "https://www.mdcalc.com/calc/3901/absolute-neutrophil-count-anc",
    category: "Hematología"
  },
  {
    name: "Corrected Calcium",
    description: "Calcio corregido por albúmina",
    url: "https://www.mdcalc.com/calc/93/calcium-correction-hypoalbuminemia",
    category: "Laboratorio"
  }
];

export default function Calculator() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCalculators = pediatricCalculators.filter(calc =>
    calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(pediatricCalculators.map(c => c.category)));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalcIcon className="h-8 w-8" />
            Calculadoras Pediátricas
          </h1>
          <p className="text-muted-foreground mt-2">
            Herramientas de cálculo médico pediátrico de MDCalc
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredCalculators.length} herramientas
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar calculadora por nombre, descripción o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Badge
            key={category}
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            onClick={() => setSearchTerm(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCalculators.map((calc, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{calc.name}</CardTitle>
                    <Badge variant="secondary" className="mb-2">
                      {calc.category}
                    </Badge>
                  </div>
                  <a
                    href={calc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
                <CardDescription className="text-sm">
                  {calc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={calc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Abrir en MDCalc
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredCalculators.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron calculadoras que coincidan con tu búsqueda.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Las calculadoras son proporcionadas por{" "}
            <a
              href="https://www.mdcalc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              MDCalc
            </a>
            . Todas las herramientas se abren en una nueva ventana.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
