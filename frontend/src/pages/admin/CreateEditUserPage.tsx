import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/user.service';
import { Role } from '../../../../shared/src/enums';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { AxiosError } from 'axios';

const createSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8, 'Minimum 8 characters'),
  role: z.nativeEnum(Role),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  companyName: z.string().optional(),
  engineerSpecialization: z.string().optional(),
});

const editSchema = createSchema.omit({ username: true, password: true });

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

export const CreateEditUserPage = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: existingUser, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id!),
    enabled: isEditing,
  });

  const schema = isEditing ? editSchema : createSchema;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({ resolver: zodResolver(schema as any) });

  const selectedRole = watch('role');

  useEffect(() => {
    if (existingUser) {
      reset({
        role: existingUser.role as Role,
        fullName: existingUser.fullName,
        email: existingUser.email,
        phone: existingUser.phone,
        companyName: existingUser.companyName,
        engineerSpecialization: existingUser.engineerSpecialization,
      } as any);
    }
  }, [existingUser, reset]);

  const onSubmit = async (data: CreateFormData) => {
    try {
      if (isEditing) {
        await userService.update(id!, data);
        toast.success('User updated');
      } else {
        await userService.create(data as any);
        toast.success('User created');
      }
      navigate('/admin/users');
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : 'Operation failed';
      toast.error(msg || 'Failed');
    }
  };

  if (isEditing && isLoading) return <PageLoader />;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEditing ? 'Edit User' : 'Create User'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {!isEditing && (
          <>
            <div>
              <label className="label">Username *</label>
              <input className="input" {...register('username')} />
              {(errors as any).username && <p className="error-text">{(errors as any).username.message}</p>}
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" {...register('password')} />
              {(errors as any).password && <p className="error-text">{(errors as any).password.message}</p>}
            </div>
          </>
        )}

        <div>
          <label className="label">Role *</label>
          <select className="input" {...register('role')}>
            <option value="">Select role</option>
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
          {errors.role && <p className="error-text">{errors.role.message}</p>}
        </div>

        <div>
          <label className="label">Full Name *</label>
          <input className="input" {...register('fullName')} />
          {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" {...register('email')} />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Phone *</label>
            <input type="tel" className="input" {...register('phone')} />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>
        </div>

        {selectedRole === Role.FACTORY_OWNER && (
          <div>
            <label className="label">Company Name</label>
            <input className="input" {...register('companyName')} />
          </div>
        )}

        {selectedRole === Role.ENGINEER && (
          <div>
            <label className="label">Specialization</label>
            <input className="input" placeholder="e.g. LV/MV Panel Maintenance" {...register('engineerSpecialization')} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
          </button>
          <button type="button" onClick={() => navigate('/admin/users')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
