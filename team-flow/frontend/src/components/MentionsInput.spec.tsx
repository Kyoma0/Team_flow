import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MentionsInput from '@/components/MentionsInput';
import api from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('MentionsInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea with default placeholder', () => {
    render(<MentionsInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Escreva algo...');
    expect(textarea).toBeInTheDocument();
  });

  it('renders textarea with custom placeholder', () => {
    render(<MentionsInput {...defaultProps} placeholder="Digite sua mensagem..." />);
    const textarea = screen.getByPlaceholderText('Digite sua mensagem...');
    expect(textarea).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = jest.fn();
    render(<MentionsInput {...defaultProps} onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onSubmit when pressing Enter without Shift', () => {
    const onSubmit = jest.fn();
    render(<MentionsInput {...defaultProps} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSubmit).toHaveBeenCalled();
  });

  it('does not call onSubmit when pressing Shift+Enter', () => {
    const onSubmit = jest.fn();
    render(<MentionsInput {...defaultProps} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders submit button with default label', () => {
    render(<MentionsInput {...defaultProps} />);
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });

  it('renders submit button with custom label', () => {
    render(<MentionsInput {...defaultProps} submitLabel="Publicar" />);
    expect(screen.getByText('Publicar')).toBeInTheDocument();
  });

  it('calls onSubmit when clicking the submit button', () => {
    const onSubmit = jest.fn();
    render(<MentionsInput {...defaultProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('Enviar'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows mention suggestions when typing @', async () => {
    const users = [
      { id: '1', username: 'joao', name: 'João Silva' },
      { id: '2', username: 'maria', name: 'Maria Souza' },
    ];
    mockedApi.get.mockResolvedValue({ data: users });

    render(<MentionsInput {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello @jo' } });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/api/users/search?q=jo');
    });

    await waitFor(() => {
      expect(screen.getByText('@joao')).toBeInTheDocument();
      expect(screen.getByText('@maria')).toBeInTheDocument();
    });
  });

  it('does not show suggestions when @ is not typed', async () => {
    render(<MentionsInput {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello world' } });

    await waitFor(() => {
      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  it('inserts mention when clicking a suggestion', async () => {
    const onChange = jest.fn();
    const users = [{ id: '1', username: 'joao', name: 'João Silva' }];
    mockedApi.get.mockResolvedValue({ data: users });

    render(<MentionsInput {...defaultProps} onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello @' } });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('@joao'))).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText((content) => content.includes('@joao')));
    expect(onChange).toHaveBeenLastCalledWith('@joao ');
  });

  it('navigates suggestions with ArrowDown and selects with Enter', async () => {
    const onChange = jest.fn();
    const users = [
      { id: '1', username: 'joao', name: 'João Silva' },
      { id: '2', username: 'maria', name: 'Maria Souza' },
    ];
    mockedApi.get.mockResolvedValue({ data: users });

    render(<MentionsInput {...defaultProps} onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello @' } });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('@joao'))).toBeInTheDocument();
    });

    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('@maria ');
  });

  it('navigates suggestions with ArrowUp', async () => {
    const onChange = jest.fn();
    const users = [
      { id: '1', username: 'joao', name: 'João Silva' },
      { id: '2', username: 'maria', name: 'Maria Souza' },
    ];
    mockedApi.get.mockResolvedValue({ data: users });

    render(<MentionsInput {...defaultProps} onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello @' } });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('@joao'))).toBeInTheDocument();
    });

    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    fireEvent.keyDown(textarea, { key: 'ArrowUp' });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('@joao ');
  });

  it('closes suggestions on Escape', async () => {
    const users = [{ id: '1', username: 'joao', name: 'João Silva' }];
    mockedApi.get.mockResolvedValue({ data: users });

    render(<MentionsInput {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello @' } });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('@joao'))).toBeInTheDocument();
    });

    fireEvent.keyDown(textarea, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText((content) => content.includes('@joao'))).not.toBeInTheDocument();
    });
  });

  it('does not call onSubmit when Enter is pressed with open suggestions', async () => {
    const onSubmit = jest.fn();
    const users = [{ id: '1', username: 'joao', name: 'João Silva' }];
    mockedApi.get.mockResolvedValue({ data: users });

    render(<MentionsInput {...defaultProps} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello @' } });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('@joao'))).toBeInTheDocument();
    });

    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders with custom rows', () => {
    render(<MentionsInput {...defaultProps} rows={4} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '4');
  });
});
