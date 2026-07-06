import { Box, Card, CardContent, Paper, Step, StepLabel, Stepper, Typography } from '@mui/material';

interface WorkflowsTabProps {
  workflows: any[];
}

export function WorkflowsTab({ workflows }: WorkflowsTabProps) {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {workflows.length > 0 ? (
        workflows.map((flow) => {
          const steps = flow.definition?.steps || [];
          return (
            <Card key={flow.workflow_id} sx={{ bgcolor: '#0b0f19', border: '1px solid #1e293b', color: '#fff' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#06b6d4' }}>
                  {flow.name} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>[Version {flow.version}]</span>
                </Typography>

                <Box sx={{ mt: 3, p: 2, bgcolor: '#020617', borderRadius: 1 }}>
                  <Stepper alternativeLabel activeStep={steps.length}>
                    {steps.map((step: any, idx: number) => (
                      <Step key={idx}>
                        <StepLabel
                          StepIconProps={{ sx: { '&.Mui-completed, &.Mui-active': { color: '#06b6d4' } } }}
                        >
                          <Typography variant="caption" sx={{ color: '#fff', display: 'block', fontWeight: 'bold' }}>
                            {step.action || 'Sequence Operation'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                            {step.module}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Paper sx={{ p: 4, bgcolor: '#0b0f19', border: '1px solid #1e293b', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No composite task orchestration trees bound to agent instance loop.</Typography>
        </Paper>
      )}
    </Box>
  );
}
