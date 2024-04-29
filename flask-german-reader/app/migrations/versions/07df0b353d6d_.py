"""empty message

Revision ID: 07df0b353d6d
Revises: 4aef1e008cc4
Create Date: 2024-04-29 18:31:41.405604

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '07df0b353d6d'
down_revision = '4aef1e008cc4'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user_vocab', schema=None) as batch_op:
        batch_op.add_column(sa.Column('definition', sa.Text(), nullable=True))
        batch_op.create_foreign_key(None, 'dictionary_entry', ['definition'], ['definition'])

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user_vocab', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('definition')

    # ### end Alembic commands ###
