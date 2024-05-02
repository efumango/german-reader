"""initial commit

Revision ID: 5a8e634d023e
Revises: 
Create Date: 2024-04-29 01:18:04.984742

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5a8e634d023e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('dictionary_entry',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('word', sa.String(length=255), nullable=False),
    sa.Column('original_form', sa.String(), nullable=True),
    sa.Column('definition', sa.Text(), nullable=False),
    sa.Column('inflection', sa.Text(), nullable=True),
    sa.Column('source', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('dictionary_entry', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dictionary_entry_word'), ['word'], unique=True)

    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=100), nullable=True),
    sa.Column('password', sa.String(length=100), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('username')
    )
    op.create_table('user_dictionary_mapping',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('entry_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['entry_id'], ['dictionary_entry.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('user_id', 'entry_id')
    )
    op.create_table('user_vocab',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('word', sa.String(length=255), nullable=False),
    sa.Column('definition', sa.Text(), nullable=False),
    sa.Column('inflection', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['definition'], ['dictionary_entry.definition'], ),
    sa.ForeignKeyConstraint(['inflection'], ['dictionary_entry.inflection'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['word'], ['dictionary_entry.word'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('user_vocab')
    op.drop_table('user_dictionary_mapping')
    op.drop_table('user')
    with op.batch_alter_table('dictionary_entry', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_dictionary_entry_word'))

    op.drop_table('dictionary_entry')
    # ### end Alembic commands ###